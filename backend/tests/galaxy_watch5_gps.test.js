import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { runMigrations, db as knexDb } from '../db.js';

describe('Samsung Galaxy Watch 5 Pro GPS & Connectivity Test Suite', () => {
  let deviceId = 'W5P-TEST-GW5-' + Date.now();
  let deviceToken = '';
  let studentId = '10001';

  beforeAll(async () => {
    await runMigrations();
  });

  it('1. should register a Galaxy Watch 5 Pro and return 256-bit token', async () => {
    const res = await request(app)
      .post('/api/devices/register')
      .send({
        deviceId,
        studentId,
        model: 'Samsung Galaxy Watch 5 Pro (SM-R920)'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.device.token).toBeDefined();
    expect(res.body.device.token.length).toBe(64);
    deviceToken = res.body.device.token;
  });

  it('2. should submit real GPS telemetry over direct Wi-Fi (connectionType = WIFI)', async () => {
    const recordId = 'rec_wifi_' + Date.now();
    const res = await request(app)
      .post('/api/devices/location')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        recordId,
        deviceId,
        lat: 41.5512,
        lng: 60.6318,
        accuracy: 3.5,
        speed: 0.8,
        altitude: 435.0,
        battery: 94,
        connectionType: 'WIFI',
        deviceTimestamp: Date.now()
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.connection_type).toBe('WIFI');
  });

  it('3. should enforce idempotency and ignore duplicate recordId', async () => {
    const recordId = 'rec_dup_' + Date.now();
    const payload = {
      recordId,
      deviceId,
      lat: 41.5515,
      lng: 60.6320,
      accuracy: 4.0,
      connectionType: 'WIFI',
      deviceTimestamp: Date.now()
    };

    // First submission
    const res1 = await request(app)
      .post('/api/devices/location')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send(payload);
    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.duplicate).toBeUndefined();

    // Duplicate submission
    const res2 = await request(app)
      .post('/api/devices/location')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send(payload);
    expect(res2.status).toBe(200);
    expect(res2.body.duplicate).toBe(true);
  });

  it('4. should submit GPS telemetry via paired Android phone (connectionType = BLUETOOTH_PHONE)', async () => {
    const recordId = 'rec_bt_' + Date.now();
    const res = await request(app)
      .post('/api/devices/location')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        recordId,
        deviceId,
        lat: 41.5520,
        lng: 60.6330,
        accuracy: 5.0,
        connectionType: 'BLUETOOTH_PHONE',
        deviceTimestamp: Date.now()
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.connection_type).toBe('BLUETOOTH_PHONE');
  });

  it('5. should process device heartbeat and update status to ONLINE', async () => {
    const res = await request(app)
      .post('/api/devices/heartbeat')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        deviceId,
        battery: 88,
        connectionType: 'WIFI',
        isWorn: true
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ONLINE');
  });

  it('6. should sync batch of offline-collected GPS records (OFFLINE_SYNC)', async () => {
    const baseTime = Date.now() - 300000;
    const records = [
      {
        recordId: 'rec_off_1_' + Date.now(),
        lat: 41.5501,
        lng: 60.6301,
        accuracy: 4.0,
        altitude: 432.0,
        battery: 89,
        connectionType: 'OFFLINE_SYNC',
        deviceTimestamp: baseTime + 10000
      },
      {
        recordId: 'rec_off_2_' + Date.now(),
        lat: 41.5505,
        lng: 60.6305,
        accuracy: 4.2,
        altitude: 433.0,
        battery: 88,
        connectionType: 'OFFLINE_SYNC',
        deviceTimestamp: baseTime + 20000
      }
    ];

    const res = await request(app)
      .post('/api/devices/sync')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        deviceId,
        records
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.synced).toBe(2);
  });

  it('7. should retrieve historical GPS locations for student', async () => {
    const res = await request(app)
      .get(`/api/students/${studentId}/locations`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.locations).toBeDefined();
    expect(res.body.locations.length).toBeGreaterThan(0);
    expect(res.body.currentLocation).toBeDefined();
  });

  it('8. should revoke device and reject subsequent submissions', async () => {
    const revokeRes = await request(app)
      .post('/api/devices/revoke')
      .send({
        deviceId,
        reason: 'Device lost by child'
      });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);

    // Subsequent telemetry should be rejected
    const teleRes = await request(app)
      .post('/api/devices/location')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        deviceId,
        lat: 41.5510,
        lng: 60.6310,
        accuracy: 5.0
      });

    expect([401, 403]).toContain(teleRes.status);
    expect(teleRes.body.success).toBe(false);
  });
});
