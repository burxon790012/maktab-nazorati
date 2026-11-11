import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { runMigrations, db as knexDb } from '../db.js';

describe('SMART CHILD – Automatic Watch Discovery & Admin Registration System Test Suite', () => {
  let superAdminToken = '';
  let teacherToken = '';
  let parentToken = '';

  const testWatchId = 'W5P-DISCOV-' + Date.now();
  const testStudentId = '10003';
  let issuedDeviceToken = '';

  beforeAll(async () => {
    await runMigrations();

    // 1. Login as Super Admin
    const saRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'burxonturayev7900@gmail.com', password: 'Burxon#Admin2026' });
    if (saRes.body.token) {
      superAdminToken = saRes.body.token;
    } else {
      const fb = await request(app).post('/api/v1/auth/login').send({ role: 'SUPER_ADMIN' });
      superAdminToken = fb.body.token;
    }

    // 2. Login as Teacher
    const teacherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ role: 'TEACHER' });
    teacherToken = teacherRes.body.token;

    // 3. Login as Parent
    const parentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ role: 'PARENT' });
    parentToken = parentRes.body.token;
  });

  afterAll(async () => {
    try {
      await knexDb('device_assignments').where('device_uid', 'like', 'W5P-DISCOV-%').del();
      await knexDb('device_credentials').where('device_uid', 'like', 'W5P-DISCOV-%').del();
      await knexDb('device_audit_logs').where('device_uid', 'like', 'W5P-DISCOV-%').del();
      await knexDb('devices').where('device_uid', 'like', 'W5P-DISCOV-%').del();
    } catch (_) {}
  });

  // TEST 1: A new watch appears in Unknown Watches after secure first contact.
  it('1. A new watch appears in Unknown Watches after secure first contact', async () => {
    const discoverRes = await request(app)
      .post('/api/v1/devices/discover')
      .send({
        deviceUid: testWatchId,
        model: 'Samsung Galaxy Watch 5 Pro (SM-R920)',
        appVersion: '1.2.0',
        batteryLevel: 94,
        isCharging: false,
        connectionType: 'WIFI'
      });

    expect(discoverRes.status).toBe(200);
    expect(discoverRes.body.success).toBe(true);
    expect(discoverRes.body.registered).toBe(false);
    expect(discoverRes.body.isAssigned).toBe(false);

    // Super Admin queries unknown watches
    const unknownRes = await request(app)
      .get('/api/v1/devices/unknown')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(unknownRes.status).toBe(200);
    expect(unknownRes.body.success).toBe(true);
    const found = unknownRes.body.devices.find(d => d.deviceUid === testWatchId);
    expect(found).toBeDefined();
    expect(found.model).toBe('Samsung Galaxy Watch 5 Pro (SM-R920)');
    expect(found.batteryLevel).toBe(94);
    expect(found.status).toBe('ONLINE');
    expect(found.isAssigned).toBe(false);
  });

  // TEST 2: A known registered watch does not appear as an unknown watch.
  it('2. A known registered watch does not appear as an unknown watch', async () => {
    const unknownRes = await request(app)
      .get('/api/v1/devices/unknown')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(unknownRes.status).toBe(200);
    // watch-5pro-01 is assigned to student 10001 in default seed
    const registeredDev = unknownRes.body.devices.find(d => d.deviceUid === 'watch-5pro-01');
    expect(registeredDev).toBeUndefined();
  });

  // TEST 3: Super Admin can assign an unknown watch to a student.
  it('3. Super Admin can assign an unknown watch to a student', async () => {
    const assignRes = await request(app)
      .post('/api/v1/devices/assign')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        deviceUid: testWatchId,
        studentId: testStudentId,
        schoolId: 'SCH001',
        notes: 'Urganch 30-maktab 5-B sinf o\'quvchisiga biriktirildi'
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.success).toBe(true);
    expect(assignRes.body.deviceUid).toBe(testWatchId);
    expect(assignRes.body.studentId).toBe(testStudentId);
    expect(assignRes.body.token).toBeDefined();
    expect(assignRes.body.token.length).toBe(64);
    issuedDeviceToken = assignRes.body.token;
  });

  // TEST 4: After assignment, the watch appears in Registered Watches.
  it('4. After assignment, the watch appears in Registered Watches', async () => {
    // 1. Must NOT appear in unknown watches anymore
    const unknownRes = await request(app)
      .get('/api/v1/devices/unknown')
      .set('Authorization', `Bearer ${superAdminToken}`);
    const foundInUnknown = unknownRes.body.devices.find(d => d.deviceUid === testWatchId);
    expect(foundInUnknown).toBeUndefined();

    // 2. MUST appear in registered watches
    const regRes = await request(app)
      .get('/api/v1/devices/registered')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(regRes.status).toBe(200);
    expect(regRes.body.success).toBe(true);
    const foundInRegistered = regRes.body.devices.find(d => d.deviceUid === testWatchId);
    expect(foundInRegistered).toBeDefined();
    expect(foundInRegistered.studentId).toBe(testStudentId);
    expect(foundInRegistered.isAssigned).toBe(true);
  });

  // TEST 5: A watch cannot be assigned to two students simultaneously.
  it('5. A watch cannot be assigned to two students simultaneously', async () => {
    // Attempt to assign the already assigned testWatchId to student 10002
    const conflictRes = await request(app)
      .post('/api/v1/devices/assign')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        deviceUid: testWatchId,
        studentId: '10002',
        schoolId: 'SCH001'
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.success).toBe(false);
  });

  // TEST 6: Unauthorized users cannot register or reassign watches.
  it('6. Unauthorized users cannot register, assign, or reassign watches', async () => {
    // 1. Unauthenticated request
    const noAuth = await request(app)
      .post('/api/v1/devices/assign')
      .send({ deviceUid: 'W5P-UNAUTH', studentId: '10001' });
    expect(noAuth.status).toBe(401);

    // 2. Teacher attempt (Forbidden)
    const teacherAttempt = await request(app)
      .post('/api/v1/devices/assign')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ deviceUid: 'W5P-UNAUTH', studentId: '10001' });
    expect(teacherAttempt.status).toBe(403);

    // 3. Parent attempt (Forbidden)
    const parentAttempt = await request(app)
      .post('/api/v1/devices/reassign')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ deviceUid: testWatchId, newStudentId: '10002' });
    expect(parentAttempt.status).toBe(403);
  });

  // TEST 7: Revoked credentials cannot authenticate.
  it('7. Revoked credentials cannot authenticate', async () => {
    // Super Admin revokes the device
    const revokeRes = await request(app)
      .post('/api/v1/devices/revoke')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ deviceUid: testWatchId, reason: 'Qurilma yo\'qotilgan deb e\'lon qilindi' });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);

    // Attempt to submit GPS telemetry with the revoked device token
    const locRes = await request(app)
      .post('/api/devices/location')
      .set('x-device-token', issuedDeviceToken)
      .send({
        deviceId: testWatchId,
        lat: 41.5510,
        lng: 60.6320,
        accuracy: 3.8,
        connectionType: 'WIFI',
        deviceTimestamp: Date.now()
      });

    expect(locRes.status).toBe(403);
    expect(locRes.body.success).toBe(false);
  });

  // TEST 8: Offline watches remain listed with an offline status.
  it('8. Offline watches remain listed with an offline status (not deleted)', async () => {
    const offlineWatchId = 'W5P-DISCOV-OFFLINE-' + Date.now();

    // Create discovery record with an old timestamp (10 minutes ago)
    await knexDb('devices').insert({
      id: offlineWatchId,
      device_uid: offlineWatchId,
      student_id: null,
      model: 'Samsung Galaxy Watch 5 Pro',
      battery_pct: 12,
      status: 'OFFLINE',
      is_assigned: 0,
      is_revoked: 0,
      first_seen_at: new Date(Date.now() - 15 * 60 * 1000),
      last_seen_at: new Date(Date.now() - 10 * 60 * 1000),
      created_at: new Date(Date.now() - 15 * 60 * 1000),
      updated_at: new Date(Date.now() - 10 * 60 * 1000)
    });

    const unknownRes = await request(app)
      .get('/api/v1/devices/unknown')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(unknownRes.status).toBe(200);
    const offlineDev = unknownRes.body.devices.find(d => d.deviceUid === offlineWatchId);
    expect(offlineDev).toBeDefined();
    expect(offlineDev.status).toBe('OFFLINE');
    expect(offlineDev.batteryLevel).toBe(12);
  });

  // TEST 9: A device cannot submit GPS data for a different student.
  it('9. A device cannot submit GPS data for a different student', async () => {
    const devValid = 'W5P-DISCOV-AUTH-' + Date.now();

    // Discover watch
    await request(app)
      .post('/api/v1/devices/discover')
      .send({ deviceUid: devValid, model: 'Samsung Galaxy Watch 5 Pro' });

    // Assign to student 10002
    const assignRes = await request(app)
      .post('/api/v1/devices/assign')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ deviceUid: devValid, studentId: '10002', schoolId: 'SCH001' });

    expect(assignRes.status).toBe(200);
    const validToken = assignRes.body.token;

    // Device tries to spoof coordinates for student 10001 instead of its assigned student 10002
    const spoofRes = await request(app)
      .post('/api/devices/location')
      .set('x-device-token', validToken)
      .send({
        deviceId: devValid,
        studentId: '10001', // Mismatched!
        lat: 41.5510,
        lng: 60.6320,
        accuracy: 3.5,
        connectionType: 'WIFI',
        deviceTimestamp: Date.now()
      });

    expect(spoofRes.status).toBe(403);
    expect(spoofRes.body.message).toContain('Student ID mos kelmadi');
  });

  // TEST 10: Duplicate first-contact requests do not create duplicate device records.
  it('10. Duplicate first-contact requests do not create duplicate device records', async () => {
    const dupWatchId = 'W5P-DISCOV-DUP-' + Date.now();

    // First contact
    const res1 = await request(app)
      .post('/api/v1/devices/discover')
      .send({ deviceUid: dupWatchId, model: 'Samsung Galaxy Watch 5 Pro', batteryLevel: 80 });
    expect(res1.status).toBe(200);

    // Duplicate contact
    const res2 = await request(app)
      .post('/api/v1/devices/discover')
      .send({ deviceUid: dupWatchId, model: 'Samsung Galaxy Watch 5 Pro', batteryLevel: 85 });
    expect(res2.status).toBe(200);

    // Verify database count for this device_uid is strictly 1
    const records = await knexDb('devices').where({ device_uid: dupWatchId });
    expect(records.length).toBe(1);
    expect(records[0].battery_pct).toBe(85);
  });
});

