/**
 * Migration: Create Telemetry Table and enhance Devices table
 * Compatible with PostgreSQL and SQLite (better-sqlite3)
 */
exports.up = async function(knex) {
  // 1. Create telemetry table
  if (!await knex.schema.hasTable('telemetry')) {
    await knex.schema.createTable('telemetry', (table) => {
      table.string('id', 64).primary();
      table.string('device_id', 64).notNullable().index();
      table.string('student_id', 64).nullable().index();
      table.double('lat').notNullable();
      table.double('lng').notNullable();
      table.float('accuracy').defaultTo(10.0);
      table.float('speed').nullable();
      table.integer('hr').nullable();
      table.integer('battery').nullable();
      table.float('temp').nullable();
      table.integer('steps').nullable();
      table.boolean('is_worn').defaultTo(true);
      table.boolean('is_sos').defaultTo(false);
      table.text('address').nullable();
      table.string('geofence_status', 30).defaultTo('OUTSIDE');
      table.bigInteger('ts').notNullable().index();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['device_id', 'ts']);
    });
  }

  // 2. Add columns to devices if they don't exist
  if (await knex.schema.hasTable('devices')) {
    const hasStatus = await knex.schema.hasColumn('devices', 'status');
    if (!hasStatus) {
      await knex.schema.alterTable('devices', (table) => {
        table.string('status', 20).defaultTo('ONLINE');
      });
    }

    const hasIsWorn = await knex.schema.hasColumn('devices', 'is_worn');
    if (!hasIsWorn) {
      await knex.schema.alterTable('devices', (table) => {
        table.boolean('is_worn').defaultTo(true);
      });
    }

    const hasLastAddress = await knex.schema.hasColumn('devices', 'last_address');
    if (!hasLastAddress) {
      await knex.schema.alterTable('devices', (table) => {
        table.text('last_address').nullable();
      });
    }
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('telemetry');
};
