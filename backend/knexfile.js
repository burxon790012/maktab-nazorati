const path = require('path');

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

const config = {
  client: client,
  connection: client === 'pg'
    ? (process.env.DATABASE_URL || {
        host: process.env.PG_HOST || '127.0.0.1',
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || '',
        database: process.env.PG_DATABASE || 'maktab_watch'
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
