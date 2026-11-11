/**
 * Migration: Create Child Safety GPS Tracking Tables
 * Compatible with PostgreSQL and SQLite (better-sqlite3)
 * Idempotent: checks hasTable before creating each table.
 */
exports.up = async function(knex) {
  // 1. devices
  if (!await knex.schema.hasTable('devices')) {
    await knex.schema.createTable('devices', (table) => {
      table.string('id', 64).primary();
      table.string('device_uid', 64).notNullable().index();
      table.string('student_id', 64).nullable().index();
      table.string('guardian_id', 64).nullable().index();
      table.string('token_hash', 128).nullable().index();
      table.string('model', 100).defaultTo('Samsung Galaxy Watch 5 Pro');
      table.integer('battery_pct').nullable();
      table.string('sharing_status', 20).defaultTo('ACTIVE'); // ACTIVE, PAUSED
      table.boolean('is_paired').defaultTo(true);
      table.timestamp('last_seen_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 2. pairing_codes
  if (!await knex.schema.hasTable('pairing_codes')) {
    await knex.schema.createTable('pairing_codes', (table) => {
      table.string('id', 64).primary();
      table.string('code', 10).notNullable().index();
      table.string('guardian_id', 64).notNullable().index();
      table.string('student_id', 64).notNullable().index();
      table.integer('failed_attempts').defaultTo(0);
      table.boolean('is_locked').defaultTo(false);
      table.boolean('is_used').defaultTo(false);
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 3. locations
  if (!await knex.schema.hasTable('locations')) {
    await knex.schema.createTable('locations', (table) => {
      table.string('id', 64).primary();
      table.string('device_id', 64).notNullable().index();
      table.string('student_id', 64).notNullable().index();
      table.double('latitude').notNullable();
      table.double('longitude').notNullable();
      table.float('accuracy').notNullable();
      table.float('altitude').nullable();
      table.float('speed').nullable();
      table.float('bearing').nullable();
      table.integer('battery_level').nullable();
      table.boolean('is_synced_offline').defaultTo(false);
      table.string('client_id', 128).nullable();
      table.timestamp('recorded_at').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Indexes requested:
      table.index(['device_id', 'recorded_at']);
      table.unique(['device_id', 'client_id']);
    });
  }

  // 4. geofences
  if (!await knex.schema.hasTable('geofences')) {
    await knex.schema.createTable('geofences', (table) => {
      table.string('id', 64).primary();
      table.string('guardian_id', 64).notNullable().index();
      table.string('student_id', 64).notNullable().index();
      table.string('name', 100).notNullable();
      table.string('type', 30).defaultTo('CUSTOM'); // HOME, SCHOOL, CUSTOM
      table.double('latitude').notNullable();
      table.double('longitude').notNullable();
      table.float('radius_meters').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 5. alert_events
  if (!await knex.schema.hasTable('alert_events')) {
    await knex.schema.createTable('alert_events', (table) => {
      table.string('id', 64).primary();
      table.string('guardian_id', 64).notNullable().index();
      table.string('student_id', 64).notNullable().index();
      table.string('device_id', 64).nullable();
      table.string('geofence_id', 64).nullable();
      table.string('event_type', 30).notNullable(); // ENTER, EXIT, LOW_BATTERY, OFFLINE, SOS
      table.text('message').notNullable();
      table.boolean('is_delayed').defaultTo(false);
      table.timestamp('triggered_at').notNullable();
      table.timestamp('read_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 6. audit_logs
  if (!await knex.schema.hasTable('audit_logs')) {
    await knex.schema.createTable('audit_logs', (table) => {
      table.string('id', 64).primary();
      table.string('user_id', 64).notNullable().index();
      table.string('action', 100).notNullable();
      table.string('target_type', 50).notNullable();
      table.string('target_id', 64).nullable();
      table.string('ip_address', 64).nullable();
      table.string('user_agent', 255).nullable();
      table.text('details').nullable(); // JSON string
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 7. device_settings
  if (!await knex.schema.hasTable('device_settings')) {
    await knex.schema.createTable('device_settings', (table) => {
      table.string('id', 64).primary();
      table.string('device_id', 64).unique().notNullable().index();
      table.integer('moving_interval_sec').defaultTo(10);
      table.integer('stationary_interval_sec').defaultTo(45);
      table.integer('low_battery_interval_sec').defaultTo(120);
      table.integer('offline_timeout_sec').defaultTo(180);
      table.float('min_accuracy_meters').defaultTo(100);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('device_settings');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('alert_events');
  await knex.schema.dropTableIfExists('geofences');
  await knex.schema.dropTableIfExists('locations');
  await knex.schema.dropTableIfExists('pairing_codes');
  await knex.schema.dropTableIfExists('devices');
};
