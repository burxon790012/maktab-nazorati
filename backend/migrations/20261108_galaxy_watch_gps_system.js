/**
 * Migration: 20261108_galaxy_watch_gps_system.js
 * Enhances database schema for Samsung Galaxy Watch 5 Pro GPS tracking:
 * - connection_type (WIFI, BLUETOOTH_PHONE, OFFLINE_SYNC)
 * - record_id for idempotency & deduplication
 * - pairing_codes enhancements
 * - device revocation support
 */
exports.up = async function(knex) {
  // 1. Enhance telemetry table
  if (await knex.schema.hasTable('telemetry')) {
    const hasRecordId = await knex.schema.hasColumn('telemetry', 'record_id');
    if (!hasRecordId) {
      await knex.schema.alterTable('telemetry', (table) => {
        table.string('record_id', 64).nullable().index();
      });
    }

    const hasConnType = await knex.schema.hasColumn('telemetry', 'connection_type');
    if (!hasConnType) {
      await knex.schema.alterTable('telemetry', (table) => {
        table.string('connection_type', 30).defaultTo('WIFI');
      });
    }

    const hasDeviceTs = await knex.schema.hasColumn('telemetry', 'device_timestamp');
    if (!hasDeviceTs) {
      await knex.schema.alterTable('telemetry', (table) => {
        table.bigInteger('device_timestamp').nullable();
      });
    }

    const hasAltitude = await knex.schema.hasColumn('telemetry', 'altitude');
    if (!hasAltitude) {
      await knex.schema.alterTable('telemetry', (table) => {
        table.float('altitude').nullable();
      });
    }
  }

  // 2. Enhance devices table
  if (await knex.schema.hasTable('devices')) {
    const hasConnType = await knex.schema.hasColumn('devices', 'connection_type');
    if (!hasConnType) {
      await knex.schema.alterTable('devices', (table) => {
        table.string('connection_type', 30).defaultTo('WIFI');
      });
    }

    const hasRevoked = await knex.schema.hasColumn('devices', 'is_revoked');
    if (!hasRevoked) {
      await knex.schema.alterTable('devices', (table) => {
        table.boolean('is_revoked').defaultTo(false);
      });
    }

    const hasLastHeartbeat = await knex.schema.hasColumn('devices', 'last_heartbeat');
    if (!hasLastHeartbeat) {
      await knex.schema.alterTable('devices', (table) => {
        table.timestamp('last_heartbeat').nullable();
      });
    }
  }

  // 3. Ensure pairing_codes table
  if (!await knex.schema.hasTable('pairing_codes')) {
    await knex.schema.createTable('pairing_codes', (table) => {
      table.string('id', 64).primary();
      table.string('code', 10).notNullable().index();
      table.string('student_id', 64).notNullable().index();
      table.string('guardian_id', 64).nullable();
      table.boolean('is_used').defaultTo(false);
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  // Graceful rollback
};

