import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { runMigrations, db as knexDb } from '../db.js';

describe('Smartwatch Telemetry & Device Management Test Suite', () => {
  let createdDeviceId = 'W5P-TEST-' + Date.now();
  let createdDeviceToken = '';

  beforeAll(async () => {
    await runMigrations();
  });

  it('1. should register a new Samsung Galaxy Watch5 Pro and return 256-bit token + QR data', async () => {
    const res = await request(app)
      .post('/api/devices/register')
      .send({
        deviceId: createdDeviceId,
        studentId: '10001',
        model: 'Samsung Galaxy Watch5 Pro (SM-R920)'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.device.deviceId).toBe(createdDeviceId);
    expect(res.body.device.token).toBeDefined();
    expect(res.body.device.token.length).toBe(64); // 256-bit hex
    expect(res.body.device.qrData).toContain(createdDeviceId);

    createdDeviceToken = res.body.device.token;
  });

  it('2. should reject telemetry with invalid Bearer token (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/device/telemetry')
      .set('Authorization', 'Bearer invalid-token-xyz-123')
      .send({
        deviceId: createdDeviceId,
        lat: 41.31108,
        lng: 69.24056,
        accuracy: 3.2
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('3. should accept telemetry with valid Bearer token and return status + address', async () => {
    const res = await request(app)
      .post('/api/device/telemetry')
      .set('Authorization', `Bearer ${createdDeviceToken}`)
      .send({
        deviceId: createdDeviceId,
        studentId: '10001',
        lat: 41.31108,
        lng: 69.24056,
        accuracy: 4.5,
        speed: 1.2,
        heartRate: 85,
        battery: 92,
        temperature: 36.6,
        steps: 3450,
        isWorn: true,
        timestamp: new Date().toISOString()
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.geofence_status).toBeDefined();
    expect(res.body.address).toBeDefined();
  });

  it('4. should list all devices with dynamic status and battery', async () => {
    const res = await request(app).get('/api/devices');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.devices)).toBe(true);

    const dev = res.body.devices.find(d => d.deviceId === createdDeviceId);
    expect(dev).toBeDefined();
    expect(dev.status).toBe('ONLINE');
    expect(dev.battery).toBe(92);
  });

  it('5. should regenerate token for a device', async () => {
    const res = await request(app)
      .post(`/api/devices/${createdDeviceId}/regenerate-token`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.token.length).toBe(64);
    expect(res.body.token).not.toBe(createdDeviceToken);
  });

  it('6. should reject invalid coordinates (out of range)', async () => {
    const res = await request(app)
      .post('/api/device/telemetry')
      .set('Authorization', `Bearer dev-token-secret-123`)
      .send({
        deviceId: 'watch-5pro-01',
        lat: 95.5, // invalid
        lng: 69.24
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('latitude');
  });

  it('7. should trigger alert on SOS emergency telemetry', async () => {
    const res = await request(app)
      .post('/api/device/telemetry')
      .set('Authorization', `Bearer dev-token-secret-123`)
      .send({
        deviceId: 'watch-5pro-01',
        studentId: '10001',
        lat: 41.31108,
        lng: 69.24056,
        isSos: true
      });

    expect(res.status).toBe(200);

    const alertsRes = await request(app).get('/api/alerts');
    expect(alertsRes.status).toBe(200);
    const sosAlert = alertsRes.body.alerts.find(a => a.type === 'SOS_ALERT' || (a.title && a.title.includes('SOS')));
    expect(sosAlert).toBeDefined();
  });
});
