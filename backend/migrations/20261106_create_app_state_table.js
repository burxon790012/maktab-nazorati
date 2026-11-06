/**
 * Migration: Create app_state persistence table
 * Persists schools, geofences, students, and system state across server redeploys and restarts.
 */
exports.up = async function(knex) {
  if (!await knex.schema.hasTable('app_state')) {
    await knex.schema.createTable('app_state', (table) => {
      table.string('key', 64).primary();
      table.text('data').notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasTable('app_state')) {
    await knex.schema.dropTable('app_state');
  }
};
