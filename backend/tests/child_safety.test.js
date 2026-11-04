import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createRequire } from 'module';
import app from '../server';

const require = createRequire(import.meta.url);
const { db: knexDb, runMigrations } = require('../db');
const { resetIpFailedAttempts } = require('../services/trackingService');

describe('Phase 1 Child Safety GPS Tracking & Security Test Suite', () => {
  let parentToken = '';
  let teacherToken = '';
  let refreshToken = '';
  let testDeviceId = '';
  let testDeviceToken = '';

  beforeAll(async () => {
    // Ensure database migrations are run
    await runMigrations();

    // Clean test tables
    await knexDb('locations').del();
    await knexDb('alert_events').del();
    await knexDb('geofences').del();
    await knexDb('pairing_codes').del();
    await knexDb('devices').del();
    await knexDb('audit_logs').del();
    resetIpFailedAttempts();
  });

  afterAll(async () => {
    await knexDb.destroy();
  });

  // =========================================================================
  // 1. AUTHENTICATION & TOKEN HANDLING
  // =========================================================================
  describe('1. Authentication & JWT', () => {
    it('should reject login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'parent@smartchild.uz', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should login successfully with correct bcrypt password and return signed JWT and refreshToken', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'parent@smartchild.uz', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe('PARENT');
      expect(res.body.user.childrenIds).toContain('10001');

      parentToken = res.body.token;
      refreshToken = res.body.refreshToken;
    });

    it('should refresh token using valid refreshToken', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should login teacher user for access control testing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'teacher@smartchild.uz', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('TEACHER');
      teacherToken = res.body.token;
    });

    it('should reject protected endpoints without Bearer token (401)', async () => {
      const res = await request(app)
        .get('/api/v1/locations/latest?studentId=10001');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. PAIRING & BRUTE-FORCE LOCKOUT
  // =========================================================================
  describe('2. Pairing & Lockout Security', () => {
    let pairingCode = '';

    it('should allow linked parent to generate a 6-digit pairing code (10-min TTL)', async () => {
      const res = await request(app)
        .post('/api/v1/devices/pairing-code')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId: '10001' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toMatch(/^\d{6}$/);
      expect(res.body.expiresInMinutes).toBe(10);

      pairingCode = res.body.code;
    });

    it('should reject pairing attempt with invalid code', async () => {
      const res = await request(app)
        .post('/api/v1/devices/pair')
        .send({ code: '000000', deviceUid: 'W5P-FAKE-UID' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should lock out pairing after 5 failed attempts per IP', async () => {
      // Send 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/devices/pair')
          .send({ code: '999999', deviceUid: 'W5P-ATTACKER' });
      }

      // 6th attempt should be blocked with 429 Too Many Requests
      const blockedRes = await request(app)
        .post('/api/v1/devices/pair')
        .send({ code: pairingCode, deviceUid: 'W5P-TEST' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.success).toBe(false);
    });

    it('should pair smartwatch with real code and return 256-bit token', async () => {
      // Clear IP lockout for testing valid pairing
      resetIpFailedAttempts();

      // Generate a fresh pairing code
      const codeRes = await request(app)
        .post('/api/v1/devices/pairing-code')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId: '10001' });

      const validCode = codeRes.body.code;

      const res = await request(app)
        .post('/api/v1/devices/pair')
        .send({
          code: validCode,
          deviceUid: 'W5P-GALAXY-WATCH-5-PRO',
          model: 'Samsung Galaxy Watch 5 Pro'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deviceId).toBeDefined();
      expect(res.body.deviceToken).toBeDefined();
      expect(res.body.deviceToken.length).toBe(64); // 256-bit hex = 64 characters

      testDeviceId = res.body.deviceId;
      testDeviceToken = res.body.deviceToken;

      // Verify token is stored as SHA-256 hash in database, NOT raw token
      const deviceRow = await knexDb('devices').where({ id: testDeviceId }).first();
      expect(deviceRow.token_hash).not.toBe(testDeviceToken);
      expect(deviceRow.token_hash.length).toBe(64); // SHA-256 hash length
    });

    it('should reject reused pairing code', async () => {
      const codeRes = await request(app)
        .post('/api/v1/devices/pairing-code')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ studentId: '10001' });

      const code = codeRes.body.code;

      // First use: success
      await request(app)
        .post('/api/v1/devices/pair')
        .send({ code, deviceUid: 'W5P-REUSE-1' });

      // Second use: reject
      const res = await request(app)
        .post('/api/v1/devices/pair')
        .send({ code, deviceUid: 'W5P-REUSE-2' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('allaqachon ishlatilgan');
    });
  });

  // =========================================================================
  // 3. TELEMETRY VALIDATION & IDEMPOTENT BATCH INGESTION
  // =========================================================================
  describe('3. Telemetry Ingestion & Idempotency', () => {
    it('should reject coordinates with invalid latitude (lat > 90)', async () => {
      const res = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${testDeviceToken}`)
        .send({
          latitude: 95.1234,
          longitude: 69.2405,
          accuracy: 15,
          recordedAt: new Date().toISOString()
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject coordinates with invalid longitude (lng > 180)', async () => {
      const res = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${testDeviceToken}`)
        .send({
          latitude: 41.3110,
          longitude: 195.2405,
          accuracy: 15,
          recordedAt: new Date().toISOString()
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject coordinates with negative or zero accuracy', async () => {
      const res = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${testDeviceToken}`)
        .send({
          latitude: 41.3110,
          longitude: 69.2405,
          accuracy: -5,
          recordedAt: new Date().toISOString()
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject timestamp far in the future', async () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${testDeviceToken}`)
        .send({
          latitude: 41.3110,
          longitude: 69.2405,
          accuracy: 10,
          recordedAt: futureTime
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should ingest batch locations and enforce idempotency on (device_id, client_id)', async () => {
      const batchPayload = {
        locations: [
          {
            clientId: 'client-pt-001',
            latitude: 41.3111,
            longitude: 69.2401,
            accuracy: 12.5,
            speed: 1.2,
            bearing: 90,
            batteryLevel: 88,
            recordedAt: new Date(Date.now() - 60000).toISOString()
          },
          {
            clientId: 'client-pt-002',
            latitude: 41.3115,
            longitude: 69.2407,
            accuracy: 8.0,
            speed: 1.4,
            bearing: 95,
            batteryLevel: 87,
            recordedAt: new Date(Date.now() - 30000).toISOString()
          }
        ]
      };

      // First ingestion: 2 inserted
      const res1 = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${testDeviceToken}`)
        .send(batchPayload);

      expect(res1.status).toBe(200);
      expect(res1.body.insertedCount).toBe(2);

      // Re-send same batch (simulating offline replay or retry)
      const res2 = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${testDeviceToken}`)
        .send(batchPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.insertedCount).toBe(0); // 0 inserted due to duplicate client_id

      // Verify total in DB for device is exactly 2
      const totalCount = await knexDb('locations').where({ device_id: testDeviceId }).count('id as c');
      expect(Number(totalCount[0].c)).toBe(2);
    });
  });

  // =========================================================================
  // 4. ACCESS CONTROL (PARENT A CANNOT READ CHILD B, TEACHER NO ACCESS)
  // =========================================================================
  describe('4. Strict Role-Based Access Control', () => {
    it('should allow linked parent to read child location and record audit log', async () => {
      const res = await request(app)
        .get('/api/v1/locations/latest?studentId=10001')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.location).toBeDefined();
      expect(res.body.location.latitude).toBeCloseTo(41.3115);

      // Verify audit log
      const audit = await knexDb('audit_logs')
        .where({ action: 'READ_CHILD_LOCATION_LATEST', target_id: '10001' })
        .first();
      expect(audit).toBeDefined();
    });

    it('should block parent from reading an unlinked child (Parent A cannot read Child B) (403)', async () => {
      const unlinkedChildId = '99999';
      const res = await request(app)
        .get(`/api/v1/locations/latest?studentId=${unlinkedChildId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Ruxsat berilmadi');
    });

    it('should block TEACHER from reading child GPS location (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/locations/latest?studentId=10001')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Ruxsat berilmadi');
    });

    it('should allow linked parent to read location history with stop detection', async () => {
      const res = await request(app)
        .get('/api/v1/locations/history?studentId=10001')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.locations)).toBe(true);
      expect(Array.isArray(res.body.stops)).toBe(true);
    });
  });

  // =========================================================================
  // 5. SAFE ZONES (GEOFENCES) & SERVER-SIDE ALERTS
  // =========================================================================
  describe('5. Geofencing Safe Zones & Alerts', () => {
    it('should allow parent to create safe zone for child', async () => {
      const res = await request(app)
        .post('/api/v1/geofences')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          studentId: '10001',
          name: 'Uy (Home Safe Zone)',
          type: 'HOME',
          latitude: 41.3110,
          longitude: 69.2405,
          radiusMeters: 150
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.geofence.name).toBe('Uy (Home Safe Zone)');
    });

    it('should list geofences for linked child', async () => {
      const res = await request(app)
        .get('/api/v1/geofences?studentId=10001')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.geofences.length).toBeGreaterThan(0);
    });

    it('should trigger ENTER alert when watch enters safe zone', async () => {
      // Ingest point inside safe zone (dist < 150m)
      const res = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${testDeviceToken}`)
        .send({
          latitude: 41.31105,
          longitude: 69.24055,
          accuracy: 10,
          recordedAt: new Date().toISOString()
        });

      expect(res.status).toBe(200);
      expect(res.body.alertsCount).toBeGreaterThanOrEqual(1);

      // Verify alert in alert_events table
      const alertsRes = await request(app)
        .get('/api/v1/alerts?studentId=10001')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(alertsRes.status).toBe(200);
      expect(alertsRes.body.alerts.length).toBeGreaterThan(0);
      expect(alertsRes.body.alerts[0].event_type).toBe('ENTER');
    });
  });

  // =========================================================================
  // 6. SSE STREAM TICKET & AUTH
  // =========================================================================
  describe('6. SSE Authentication with Single-Use Ticket', () => {
    it('should generate a 60-second single-use stream ticket and validate single-use', async () => {
      const res = await request(app)
        .post('/api/v1/stream/ticket')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket).toBeDefined();
      expect(res.body.expiresIn).toBe(60);

      const ticket = res.body.ticket;

      // Consume ticket in SSE endpoint with immediateClose=1 to cleanly close stream after connection
      const sseRes = await request(app)
        .get(`/api/v1/stream?ticket=${ticket}&immediateClose=1`)
        .expect(200);

      expect(sseRes.headers['content-type']).toContain('text/event-stream');
      expect(sseRes.text).toContain('connected');

      // Attempt to reuse consumed ticket: should be rejected (401)
      const reuseRes = await request(app)
        .get(`/api/v1/stream?ticket=${ticket}`);

      expect(reuseRes.status).toBe(401);
    });
  });

  // =========================================================================
  // 7. PRIVACY, DATA RETENTION & UNPAIR (TOKEN REVOCATION)
  // =========================================================================
  describe('7. Privacy & Token Revocation on Unpair', () => {
    it('should check device status (ONLINE/OFFLINE)', async () => {
      const res = await request(app)
        .get(`/api/v1/devices/${testDeviceId}/status`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.device.status).toBe('ONLINE');
      expect(res.body.device.sharingStatus).toBe('ACTIVE');
    });

    it('should allow pausing location sharing', async () => {
      const res = await request(app)
        .patch(`/api/v1/devices/${testDeviceId}/sharing`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ sharingStatus: 'PAUSED' });

      expect(res.status).toBe(200);
      expect(res.body.sharingStatus).toBe('PAUSED');
    });

    it('should unpair device and revoke device token', async () => {
      const res = await request(app)
        .delete(`/api/v1/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify device row in database has token_hash = null and is_paired = 0
      const deviceRow = await knexDb('devices').where({ id: testDeviceId }).first();
      expect(deviceRow.token_hash).toBeNull();
      expect(deviceRow.is_paired).toBe(0);
    });

    it('should reject subsequent telemetry with revoked device token (401)', async () => {
      const res = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${testDeviceToken}`)
        .send({
          latitude: 41.3110,
          longitude: 69.2405,
          accuracy: 10,
          recordedAt: new Date().toISOString()
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('bekor qilingan');
    });

    it('should allow parent to delete all GPS location records of their child', async () => {
      const res = await request(app)
        .delete('/api/v1/students/10001/locations')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify locations count is now 0
      const remaining = await knexDb('locations').where({ student_id: '10001' }).count('id as c');
      expect(Number(remaining[0].c)).toBe(0);
    });
  });
});
