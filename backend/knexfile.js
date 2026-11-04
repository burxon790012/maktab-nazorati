const path = require('path');

const client = process.env.DB_CLIENT || (process.env.DATABASE_URL ? 'pg' : 'better-sqlite3');

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

