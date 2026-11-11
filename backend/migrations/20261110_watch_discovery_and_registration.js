/**
 * Migration: 20261110_watch_discovery_and_registration.js
 * Creates and enhances tables for SMART CHILD Automatic Watch Discovery & Admin Registration:
 * - devices: ensures model, app_version, battery_level, is_assigned, student_id (nullable), school_id, first_seen_at, last_seen_at, is_revoked
 * - device_credentials: cryptographically secure authentication credentials and revocation history
 * - device_assignments: history and active binding of watches to students
 * - device_heartbeats: log of device heartbeats and status
 * - device_audit_logs: security audit log of all device lifecycle events
 */
exports.up = async function(knex) {
  const isSqlite = knex.client.dialect === 'sqlite3';

  // 1. Ensure devices table exists and student_id / guardian_id are nullable
  const hasDevices = await knex.schema.hasTable('devices');
  if (!hasDevices) {
    await knex.schema.createTable('devices', (table) => {
      table.string('id', 64).primary();
      table.string('device_uid', 64).notNullable().unique();
      table.string('student_id', 64).nullable().index();
      table.string('school_id', 64).nullable().index();
      table.string('guardian_id', 64).nullable().index();
      table.string('token_hash', 128).nullable().index();
      table.string('model', 100).defaultTo('Samsung Galaxy Watch 5 Pro');
      table.string('app_version', 50).defaultTo('1.0.0');
      table.integer('battery_pct').nullable();
      table.boolean('is_charging').defaultTo(false);
      table.string('sharing_status', 20).defaultTo('ACTIVE');
      table.string('status', 20).defaultTo('ONLINE');
      table.boolean('is_paired').defaultTo(false);
      table.boolean('is_assigned').defaultTo(false).index();
      table.boolean('is_revoked').defaultTo(false).index();
      table.string('connection_type', 30).defaultTo('WIFI');
      table.boolean('is_worn').defaultTo(true);
      table.timestamp('last_heartbeat').nullable();
      table.text('last_address').nullable();
      table.timestamp('first_seen_at').defaultTo(knex.fn.now());
      table.timestamp('last_seen_at').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  } else {
    // If SQLite devices table has NOT NULL on student_id, recreate it cleanly to allow unassigned watches:
    if (isSqlite) {
      const tableInfo = await knex.raw("PRAGMA table_info('devices')");
      const studentCol = tableInfo.find(c => c.name === 'student_id');
      if (studentCol && studentCol.notnull === 1) {
        await knex.raw("PRAGMA foreign_keys=off");
        await knex.raw("CREATE TABLE devices_migration_bak AS SELECT * FROM devices");
        await knex.schema.dropTable('devices');
        await knex.schema.createTable('devices', (table) => {
          table.string('id', 64).primary();
          table.string('device_uid', 64).notNullable().unique();
          table.string('student_id', 64).nullable().index();
          table.string('school_id', 64).nullable().index();
          table.string('guardian_id', 64).nullable().index();
          table.string('token_hash', 128).nullable().index();
          table.string('model', 100).defaultTo('Samsung Galaxy Watch 5 Pro');
          table.string('app_version', 50).defaultTo('1.0.0');
          table.integer('battery_pct').nullable();
          table.boolean('is_charging').defaultTo(false);
          table.string('sharing_status', 20).defaultTo('ACTIVE');
          table.string('status', 20).defaultTo('ONLINE');
          table.boolean('is_paired').defaultTo(false);
          table.boolean('is_assigned').defaultTo(false).index();
          table.boolean('is_revoked').defaultTo(false).index();
          table.string('connection_type', 30).defaultTo('WIFI');
          table.boolean('is_worn').defaultTo(true);
          table.timestamp('last_heartbeat').nullable();
          table.text('last_address').nullable();
          table.timestamp('first_seen_at').defaultTo(knex.fn.now());
          table.timestamp('last_seen_at').defaultTo(knex.fn.now());
          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
        const cols = await knex.raw("PRAGMA table_info('devices_migration_bak')");
        const existingColNames = cols.map(c => c.name).filter(n => ['id', 'device_uid', 'student_id', 'guardian_id', 'token_hash', 'model', 'battery_pct', 'sharing_status', 'is_paired', 'last_seen_at', 'created_at', 'updated_at', 'connection_type', 'is_revoked', 'last_heartbeat'].includes(n));
        const colList = existingColNames.join(', ');
        await knex.raw(`INSERT OR REPLACE INTO devices (${colList}) SELECT ${colList} FROM devices_migration_bak`);
        await knex.raw("DROP TABLE devices_migration_bak");
        await knex.raw("PRAGMA foreign_keys=on");
      }
    } else {
      // Postgres: drop not null
      try {
        await knex.raw("ALTER TABLE devices ALTER COLUMN student_id DROP NOT NULL");
        await knex.raw("ALTER TABLE devices ALTER COLUMN guardian_id DROP NOT NULL");
      } catch (_) {}
    }

    // Add extra columns if not present
    const addColIfNotExists = async (colName, colBuilder) => {
      const exists = await knex.schema.hasColumn('devices', colName);
      if (!exists) {
        await knex.schema.alterTable('devices', (table) => {
          colBuilder(table);
        });
      }
    };

    await addColIfNotExists('app_version', (t) => t.string('app_version', 50).defaultTo('1.0.0'));
    await addColIfNotExists('school_id', (t) => t.string('school_id', 64).nullable().index());
    await addColIfNotExists('is_charging', (t) => t.boolean('is_charging').defaultTo(false));
    await addColIfNotExists('is_assigned', (t) => t.boolean('is_assigned').defaultTo(false).index());
    await addColIfNotExists('first_seen_at', (t) => t.timestamp('first_seen_at').nullable());
    await addColIfNotExists('status', (t) => t.string('status', 20).defaultTo('ONLINE'));
  }

  // 2. device_credentials table
  if (!await knex.schema.hasTable('device_credentials')) {
    await knex.schema.createTable('device_credentials', (table) => {
      table.string('id', 64).primary();
      table.string('device_uid', 64).notNullable().index();
      table.string('token_hash', 128).notNullable().index();
      table.boolean('is_revoked').defaultTo(false).index();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('revoked_at').nullable();
      table.timestamp('last_used_at').nullable();
    });
  }

  // 3. device_assignments table
  if (!await knex.schema.hasTable('device_assignments')) {
    await knex.schema.createTable('device_assignments', (table) => {
      table.string('id', 64).primary();
      table.string('device_uid', 64).notNullable().index();
      table.string('student_id', 64).notNullable().index();
      table.string('school_id', 64).notNullable().index();
      table.string('assigned_by', 100).notNullable();
      table.boolean('is_active').defaultTo(true).index();
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      table.timestamp('unassigned_at').nullable();
      table.text('notes').nullable();
    });
  }

  // 4. device_heartbeats table
  if (!await knex.schema.hasTable('device_heartbeats')) {
    await knex.schema.createTable('device_heartbeats', (table) => {
      table.string('id', 64).primary();
      table.string('device_uid', 64).notNullable().index();
      table.integer('battery_level').nullable();
      table.boolean('is_charging').defaultTo(false);
      table.string('channel', 30).defaultTo('WIFI');
      table.integer('unsynced_count').defaultTo(0);
      table.string('app_version', 50).nullable();
      table.timestamp('received_at').defaultTo(knex.fn.now()).index();
    });
  }

  // 5. device_audit_logs table
  if (!await knex.schema.hasTable('device_audit_logs')) {
    await knex.schema.createTable('device_audit_logs', (table) => {
      table.string('id', 64).primary();
      table.string('device_uid', 64).nullable().index();
      table.string('student_id', 64).nullable().index();
      table.string('actor', 100).notNullable();
      table.string('action', 50).notNullable().index(); // DISCOVERY, REGISTRATION, ASSIGN, REASSIGN, UNASSIGN, REVOKE, AUTH_FAIL
      table.text('details').nullable();
      table.string('ip_address', 45).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasTable('device_audit_logs')) await knex.schema.dropTable('device_audit_logs');
  if (await knex.schema.hasTable('device_heartbeats')) await knex.schema.dropTable('device_heartbeats');
  if (await knex.schema.hasTable('device_assignments')) await knex.schema.dropTable('device_assignments');
  if (await knex.schema.hasTable('device_credentials')) await knex.schema.dropTable('device_credentials');
};
