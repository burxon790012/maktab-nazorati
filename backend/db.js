// Auto-detect pg client if DATABASE_URL is provided in environment
if (process.env.DATABASE_URL && !process.env.DB_CLIENT) {
  process.env.DB_CLIENT = 'pg';
}

// Fail fast in production if DB_CLIENT is not set
if (process.env.NODE_ENV === 'production' && !process.env.DB_CLIENT) {
  console.error('\n==================================================================');
  console.error('❌ XATOLIK: Ishlab chiqarish (production) rejimida PostgreSQL sozlanmagan!');
  console.error('👉 Railway: Dashboard → + New → Database → Add PostgreSQL, keyin DATABASE_URL ni servisga ulang.');
  console.error('👉 Render: Dashboard → + New → PostgreSQL, keyin DATABASE_URL ni Environment bo\'limiga qo\'ying.');
  console.error('👉 Boshqa server: DATABASE_URL="postgres://user:pass@host:5432/db" deb env ga kiriting.');
  console.error('==================================================================\n');
  throw new Error('Set DB_CLIENT=pg and DATABASE_URL');
}

const knex = require('knex');
const knexConfig = require('./knexfile');

let knexInstance = null;

function getDb() {
  if (!knexInstance) {
    knexInstance = knex(knexConfig);
  }
  return knexInstance;
}

// Transparent lazy Proxy for knex instance
const dbProxy = new Proxy(function() {}, {
  apply(target, thisArg, argArray) {
    const instance = getDb();
    return instance(...argArray);
  },
  get(target, prop) {
    const instance = getDb();
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  }
});

async function runMigrations() {
  const instance = getDb();
  await instance.migrate.latest();
}

module.exports = {
  db: dbProxy,
  getDb,
  runMigrations
};
