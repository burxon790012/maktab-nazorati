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
  runMigrations,
  knexConfig
};
