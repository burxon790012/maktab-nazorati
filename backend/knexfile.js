const path = require('path');
const fs = require('fs');

// 1. Check if PostgreSQL is configured via DATABASE_URL or explicit DB_CLIENT='pg'
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
const requirePg = process.env.REQUIRE_PG === 'true';

let client = 'better-sqlite3';

if (hasDatabaseUrl || process.env.DB_CLIENT === 'pg') {
  client = 'pg';
  process.env.DB_CLIENT = 'pg';
} else if (requirePg) {
  console.error('\n==================================================================');
  console.error('❌ XATOLIK: REQUIRE_PG=true belgilangan, lekin DATABASE_URL mavjud emas!');
  console.error('👉 Ishlab chiqarish (production) rejimida PostgreSQL ma\'lumotlar bazasi ulanishi shart.');
  console.error('👉 Railway: Dashboard → + New → Database → Add PostgreSQL, keyin DATABASE_URL ni servisga ulang.');
  console.error('👉 Render: Dashboard → + New → PostgreSQL, keyin DATABASE_URL ni Environment bo\'limiga qo\'ying.');
  console.error('👉 Boshqa server: DATABASE_URL="postgres://user:pass@host:5432/db" deb env ga kiriting.');
  console.error('==================================================================\n');
  throw new Error('REQUIRE_PG is true, but DATABASE_URL is not set');
} else {
  // Sinov rejimi (Test / Temporary preview mode)
  client = 'better-sqlite3';
  process.env.DB_CLIENT = 'better-sqlite3';
  
  if (!global.__SQLITE_FALLBACK_WARNED__) {
    global.__SQLITE_FALLBACK_WARNED__ = true;
    const defaultSqlitePath = process.env.NODE_ENV === 'production'
      ? '/tmp/data.sqlite'
      : path.join(__dirname, 'data', 'child_safety.sqlite');
    const activeSqliteFile = process.env.SQLITE_PATH || defaultSqlitePath;

    console.warn('\n==================================================================');
    console.warn('⚠️  SINOV REJIMI (TEST MODE): DATABASE_URL topilmadi!');
    console.warn(`⚠️  Ma'lumotlar vaqtinchalik SQLite'da saqlanmoqda: ${activeSqliteFile}`);
    console.warn('⚠️  DIQQAT: Redeploy yoki server restart bo\'lganda ma\'lumotlar O\'CHIB KETADI!');
    console.warn('👉 Doimiy saqlash uchun DATABASE_URL (PostgreSQL) ulang.');
    console.warn('👉 Agar productionda SQLite taqiqlanishi kerak bo\'lsa: REQUIRE_PG=true qo\'ying.');
    console.warn('==================================================================\n');
  }
}

// 2. Resolve SQLite target file and ensure directory exists
const sqlitePath = process.env.SQLITE_PATH || (
  process.env.NODE_ENV === 'production'
    ? '/tmp/data.sqlite'
    : path.join(__dirname, 'data', 'child_safety.sqlite')
);
const sqliteDir = path.dirname(sqlitePath);
if (!fs.existsSync(sqliteDir)) {
  try {
    fs.mkdirSync(sqliteDir, { recursive: true });
  } catch (err) {
    console.warn(`Could not create SQLite directory ${sqliteDir}:`, err.message);
  }
}

// 3. PostgreSQL SSL configuration
const isLocalhost = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('localhost') ||
  process.env.DATABASE_URL.includes('127.0.0.1')
);
const pgSslDisabled = (
  process.env.PGSSL === 'false' ||
  process.env.PG_NO_SSL === 'true' ||
  process.env.PGSSLMODE === 'disable'
);
const useSsl = client === 'pg' && !isLocalhost && !pgSslDisabled;

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
        filename: sqlitePath
      },
  useNullAsDefault: client === 'better-sqlite3',
  pool: client === 'better-sqlite3' ? {
    afterCreate: (conn, cb) => {
      try {
        conn.pragma('journal_mode = WAL');
        conn.pragma('foreign_keys = ON');
      } catch (e) {}
      cb();
    }
  } : { min: 2, max: 10 },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations'
  }
};

module.exports = config;
