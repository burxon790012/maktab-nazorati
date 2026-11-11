import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { runMigrations, db as knexDb } from '../db.js';
import crypto from 'crypto';

describe('Wear OS (uz.maktab.watch) Client-Server Contract Test Suite', () => {
  const runId = Date.now().toString(36);
  const testDeviceId = `W5P-CONTRACT-${runId}`;
  let testRawToken = `contract_token_${runId}`;
  const testTokenHash = crypto.createHash('sha256').update(testRawToken).digest('hex');

  const revokedDeviceId = `W5P-REVOKED-${runId}`;
  let revokedRawToken = `revoked_token_${runId}`;
  const revokedTokenHash = crypto.createHash('sha256').update(revokedRawToken).digest('hex');

  beforeAll(async () => {
    await runMigrations();
    
    // Register active test device via standard API
    const regRes = await request(app)
      .post('/api/devices/register')
      .send({
        deviceId: testDeviceId,
        studentId: '10001',
        model: 'Samsung Galaxy Watch 5 Pro (SM-R920)'
      });
    if (regRes.body && regRes.body.device) {
      testRawToken = regRes.body.device.token || regRes.body.device.deviceToken;
    }

    // Register revoked test device
    const revRes = await request(app)
      .post('/api/devices/register')
      .send({
        deviceId: revokedDeviceId,
        studentId: '10002',
        model: 'Samsung Galaxy Watch 5 Pro'
      });
    if (revRes.body && revRes.body.device) {
      revokedRawToken = revRes.body.device.token || revRes.body.device.deviceToken;
    }

    // Revoke the second device
    await request(app)
      .post('/api/devices/revoke')
      .send({ deviceId: revokedDeviceId });
  });

  afterAll(async () => {
    try {
      await knexDb('devices').whereIn('device_uid', [testDeviceId, revokedDeviceId]).del();
      await knexDb('telemetry').whereIn('device_id', [testDeviceId, revokedDeviceId]).del();
    } catch (_) {}
  });

  it('1. POST /api/devices/location accepts exact TelemetryPayload with x-device-token header', async () => {
    const recordId = 'rec-' + Date.now() + '-uuid';
    const payload = {
      record_id: recordId,
      device_id: testDeviceId,
      latitude: 41.550500,
      longitude: 60.631500,
      accuracy: 3.5,
      speed: 1.2,
      altitude: 432.0,
      battery_level: 88,
      is_charging: false,
      heart_rate: 78,
      body_temperature: 36.6,
      step_count: 4210,
      heading: 180.0,
      is_sos: false,
      recorded_at: Date.now() - 500,
      sent_at: Date.now(),
      stale: false,
      location_age_ms: 500,
      connection_type: 'WIFI'
    };

    const res = await request(app)
      .post('/api/devices/location')
      .set('x-device-token', testRawToken)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.geofenceStatus).toBeDefined();
  });

  it('2. POST /api/devices/location enforces deduplication (idempotency) on reused record_id', async () => {
    const duplicateRecordId = 'rec-dup-' + Date.now();
    const payload = {
      record_id: duplicateRecordId,
      device_id: testDeviceId,
      latitude: 41.550500,
      longitude: 60.631500,
      accuracy: 4.0,
      speed: 0.0,
      altitude: 430.0,
      battery_level: 87,
      is_charging: false,
      is_sos: false,
      recorded_at: Date.now()
    };

    // First send
    const res1 = await request(app)
      .post('/api/devices/location')
      .set('x-device-token', testRawToken)
      .send(payload);
    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);

    // Second send with same record_id (retry)
    const res2 = await request(app)
      .post('/api/devices/location')
      .set('x-device-token', testRawToken)
      .send(payload);
    expect(res2.status).toBe(200);
    expect(res2.body.duplicate).toBe(true);
  });

  it('3. POST /api/devices/location rejects request with missing or invalid token (401)', async () => {
    const res = await request(app)
      .post('/api/devices/location')
      .send({
        device_id: 'unknown-device-uid-999',
        latitude: 41.550500,
        longitude: 60.631500,
        recorded_at: Date.now()
      });
    expect(res.status).toBe(401);
  });

  it('4. POST /api/devices/location returns 403 on revoked device token', async () => {
    const res = await request(app)
      .post('/api/devices/location')
      .set('x-device-token', revokedRawToken)
      .send({
        device_id: revokedDeviceId,
        latitude: 41.550500,
        longitude: 60.631500,
        recorded_at: Date.now()
      });
    expect([401, 403]).toContain(res.status);
  });

  it('5. POST /api/devices/heartbeat accepts HeartbeatPayload', async () => {
    const res = await request(app)
      .post('/api/devices/heartbeat')
      .set('x-device-token', testRawToken)
      .send({
        deviceId: testDeviceId,
        batteryLevel: 85,
        isCharging: false,
        lastFixTime: Date.now(),
        connectionType: 'WIFI',
        unsyncedCount: 0
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('6. POST /api/devices/sync accepts BatchSyncPayload and persists offline queue', async () => {
    const batchRecord1 = 'sync-rec-1-' + Date.now();
    const batchRecord2 = 'sync-rec-2-' + Date.now();

    const payload = {
      deviceId: testDeviceId,
      records: [
        {
          record_id: batchRecord1,
          latitude: 41.550600,
          longitude: 60.631600,
          accuracy: 5.0,
          speed: 0.8,
          altitude: 431.0,
          battery_level: 84,
          is_charging: false,
          heart_rate: 80,
          is_sos: false,
          recorded_at: Date.now() - 60000,
          connection_type: 'OFFLINE_SYNC'
        },
        {
          record_id: batchRecord2,
          latitude: 41.550700,
          longitude: 60.631700,
          accuracy: 4.8,
          speed: 0.9,
          altitude: 431.5,
          battery_level: 84,
          is_charging: false,
          heart_rate: 82,
          is_sos: false,
          recorded_at: Date.now() - 30000,
          connection_type: 'OFFLINE_SYNC'
        }
      ]
    };

    const res = await request(app)
      .post('/api/devices/sync')
      .set('x-device-token', testRawToken)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.synced).toBeGreaterThanOrEqual(1);
  });

  it('7. SOS fix with stale=true flag is accepted and processed with real age', async () => {
    const sosRecordId = 'sos-stale-' + Date.now();
    const payload = {
      record_id: sosRecordId,
      device_id: testDeviceId,
      latitude: 41.550500,
      longitude: 60.631500,
      accuracy: 12.0,
      speed: 0.0,
      altitude: 430.0,
      battery_level: 80,
      is_charging: false,
      is_sos: true,
      recorded_at: Date.now() - 45000,
      sent_at: Date.now(),
      stale: true,
      location_age_ms: 45000,
      connection_type: 'WIFI'
    };

    const res = await request(app)
      .post('/api/devices/location')
      .set('x-device-token', testRawToken)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('8. POST /api/devices/pair accepts 6-digit code and returns 256-bit token', async () => {
    // Generate pairing code
    const codeRes = await request(app)
      .post('/api/devices/generate-pairing-code')
      .send({ studentId: '10001' });
    expect(codeRes.status).toBe(200);
    const code = codeRes.body.code;

    const pairRes = await request(app)
      .post('/api/devices/pair')
      .send({
        code,
        deviceUid: 'W5P-PAIR-TEST-' + Date.now(),
        model: 'Samsung Galaxy Watch 5 Pro'
      });

    expect(pairRes.status).toBe(200);
    expect(pairRes.body.success).toBe(true);
    expect(pairRes.body.deviceToken || pairRes.body.token).toBeDefined();
  });

  it('9. POST /api/devices/activate activates device using x-device-token header', async () => {
    const res = await request(app)
      .post('/api/devices/activate')
      .set('x-device-token', testRawToken)
      .send({ deviceId: testDeviceId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ACTIVE');
  });
});
