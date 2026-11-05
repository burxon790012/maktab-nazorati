const path = require('path');

// Auto-detect pg client if DATABASE_URL is provided in environment
if (process.env.DATABASE_URL && !process.env.DB_CLIENT) {
  process.env.DB_CLIENT = 'pg';
}

// Fail fast in production if DATABASE_URL and DB_CLIENT are not set
if (process.env.NODE_ENV === 'production' && !process.env.DB_CLIENT) {
  console.error('\n==================================================================');
  console.error('❌ XATOLIK: Ishlab chiqarish (production) rejimida PostgreSQL sozlanmagan!');
  console.error('👉 Railway: Dashboard → + New → Database → Add PostgreSQL, keyin DATABASE_URL ni servisga ulang.');
  console.error('👉 Render: Dashboard → + New → PostgreSQL, keyin DATABASE_URL ni Environment bo\'limiga qo\'ying.');
  console.error('👉 Boshqa server: DATABASE_URL="postgres://user:pass@host:5432/db" deb env ga kiriting.');
  console.error('==================================================================\n');
  throw new Error('Set DB_CLIENT=pg and DATABASE_URL');
}

let client = process.env.DB_CLIENT || (process.env.DATABASE_URL ? 'pg' : 'better-sqlite3');

// Lazy verify better-sqlite3 availability
if (client === 'better-sqlite3') {
  try {
    require.resolve('better-sqlite3');
  } catch (e) {
    if (process.env.DATABASE_URL) {
      console.warn('⚠️ Warning: better-sqlite3 mavjud emas. PostgreSQL (pg) mijoziga o\'tilmoqda.');
      client = 'pg';
    } else {
      console.error('❌ Error: better-sqlite3 o\'rnatilmagan va DATABASE_URL belgilanmagan. Ishlab chiqarish muhitida DB_CLIENT=pg va DATABASE_URL ni o\'rnating.');
    }
  }
}

// SSL handling for PostgreSQL (Render/Railway/Cloud providers require rejectUnauthorized: false for self-signed certificates)
const useSsl = process.env.PG_SSL === 'true' || (
  process.env.NODE_ENV === 'production' &&
  !process.env.PG_NO_SSL &&
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1')
);

const config = {
  client: client,
  connection: client === 'pg'
    ? (process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: useSsl ? { rejectUnauthorized: false } : false
          }
        : {
            host: process.env.PG_HOST || '127.0.0.1',
            port: process.env.PG_PORT || 5432,
            user: process.env.PG_USER || 'postgres',
            password: process.env.PG_PASSWORD || '',
            database: process.env.PG_DATABASE || 'maktab_watch',
            ssl: useSsl ? { rejectUnauthorized: false } : false
          })
    : {
        filename: process.env.SQLITE_PATH || path.join(__dirname, 'data', 'child_safety.sqlite')
      },
  useNullAsDefault: client === 'better-sqlite3',
  pool: client === 'better-sqlite3' ? {
    afterCreate: (conn, cb) => {
      conn.pragma('journal_mode = WAL');
      conn.pragma('foreign_keys = ON');
      cb();
    }
  } : { min: 2, max: 10 },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations'
  }
};

module.exports = config;
