const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig);

async function runMigrations() {
  await db.migrate.latest();
}

module.exports = {
  db,
  runMigrations
};

