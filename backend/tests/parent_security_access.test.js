import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('SMART CHILD Parent Security & Object-Level Access Control', () => {
  let parentToken = '';
  let parentChildId = 'STU-4001';
  let otherChildId = '10001'; // Belongs to Ali Valiyev, not this parent

  beforeAll(async () => {
    // 1. Create a school, teacher, student, and parent
    const saRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'burxonturayev7900@gmail.com', password: 'Burxon#Admin2026' });
    const superAdminToken = saRes.body.token;

    const schRes = await request(app)
      .post('/api/v1/super-admin/schools-with-director')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Urganch Test Maktab',
        code: 'SCH999',
        address: 'Urganch Test',
        lat: 41.55,
        lng: 60.62,
        directorName: 'Direktor Test',
        directorLogin: 'dir_test_999',
        directorPassword: 'DirPassword123'
      });
    const schoolId = schRes.body.school.id;

    const dirRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: 'dir_test_999', password: 'DirPassword123' });
    const dirToken = dirRes.body.token;

    await request(app)
      .post('/api/v1/director/teachers')
      .set('Authorization', `Bearer ${dirToken}`)
      .send({
        name: 'Oqituvchi Test',
        username: 'oqi_test_999',
        password: 'OqiPassword123',
        classId: 'cls-999-1',
        className: '1-A'
      });

    const teacherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: 'oqi_test_999', password: 'OqiPassword123' });
    const teacherToken = teacherRes.body.token;

    await request(app)
      .post('/api/v1/teacher/students-with-parent')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Farhod Testov',
        studentId: parentChildId,
        className: '1-A',
        classId: 'cls-999-1',
        deviceId: 'watch-test-999',
        parentName: 'Ota Testov',
        parentPhone: '+998901239999',
        parentLogin: 'ota_test_999',
        parentPassword: 'OtaPassword999'
      });

    // Parent Login
    const pLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: 'ota_test_999', password: 'OtaPassword999' });

    expect(pLoginRes.status).toBe(200);
    expect(pLoginRes.body.success).toBe(true);
    expect(pLoginRes.body.user.role).toBe('PARENT');
    parentToken = pLoginRes.body.token;
  });

  it('1. Parent login with invalid password must fail (401)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: 'ota_test_999', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('2. GET /api/v1/parent/children returns ONLY the authorized child', async () => {
    const res = await request(app)
      .get('/api/v1/parent/children')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.children)).toBe(true);
    expect(res.body.children.length).toBe(1);
    expect(res.body.children[0].id).toBe(parentChildId);
  });

  it('3. GET /api/v1/parent/my-children alias also returns authorized child', async () => {
    const res = await request(app)
      .get('/api/v1/parent/my-children')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.children[0].id).toBe(parentChildId);
  });

  it('4. Parent CAN access their own child telemetry', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/child/${parentChildId}/telemetry`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.studentId).toBe(parentChildId);
  });

  it('5. Parent CANNOT access another child telemetry (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/parent/child/${otherChildId}/telemetry`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('6. Parent CANNOT access another child single details via /api/v1/students/:id (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/students/${otherChildId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('7. Parent CAN access their own child details via /api/v1/students/:id', async () => {
    const res = await request(app)
      .get(`/api/v1/students/${parentChildId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student.id).toBe(parentChildId);
  });

  it('8. Parent CANNOT access another child route history (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/students/${otherChildId}/route-history`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('9. Parent CAN access their own child route history', async () => {
    const res = await request(app)
      .get(`/api/v1/students/${parentChildId}/route-history`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.studentId).toBe(parentChildId);
  });
});

