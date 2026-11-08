import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('SMART CHILD 4-Level Hierarchy & Role-Based Access Control', () => {
  let superAdminToken = '';
  let directorToken = '';
  let teacherToken = '';
  let parentToken = '';
  let newSchoolId = '';
  let newStudentId = '';

  beforeAll(async () => {
    // 1. Super Admin Login
    const saRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'burxonturayev7900@gmail.com', password: 'Burxon#Admin2026' });
    expect(saRes.status).toBe(200);
    superAdminToken = saRes.body.token;
  });

  it('1. Super Admin creates School with Director credentials', async () => {
    const res = await request(app)
      .post('/api/v1/super-admin/schools-with-director')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Urganch 40-maktab',
        code: 'SCH040',
        address: 'Urganch shahar, Al-Xorazmiy ko\'chasi',
        lat: 41.554000,
        lng: 60.628000,
        directorName: 'Qodir Rahimov',
        directorLogin: 'direktor_40',
        directorPassword: 'Direktor40#Password'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.school.name).toBe('Urganch 40-maktab');
    expect(res.body.director.username).toBe('direktor_40');
    newSchoolId = res.body.school.id;
  });

  it('2. Created Director logs in and gets SCHOOL_ADMIN role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: 'direktor_40', password: 'Direktor40#Password' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('SCHOOL_ADMIN');
    expect(res.body.user.schoolId).toBe(newSchoolId);
    directorToken = res.body.token;
  });

  it('3. School Director creates a Teacher for their school', async () => {
    const res = await request(app)
      .post('/api/v1/director/teachers')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({
        name: 'Nodira Salimova',
        username: 'nodira_oqituvchi',
        password: 'Oqituvchi40#Password',
        classId: 'cls-40-5a',
        className: '5-A'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.teacher.username).toBe('nodira_oqituvchi');
    expect(res.body.teacher.schoolId).toBe(newSchoolId);
  });

  it('4. Created Teacher logs in and gets TEACHER role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: 'nodira_oqituvchi', password: 'Oqituvchi40#Password' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('TEACHER');
    teacherToken = res.body.token;
  });

  it('5. Teacher registers Student and generates Parent account', async () => {
    const res = await request(app)
      .post('/api/v1/teacher/students-with-parent')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Jasurbek Qodirov',
        studentId: 'STU-4001',
        className: '5-A',
        classId: 'cls-40-5a',
        deviceId: 'watch-5pro-4001',
        parentName: 'Qodir Karimov',
        parentPhone: '+998909876543',
        parentLogin: 'ota_jasurbek',
        parentPassword: 'Ota4001#Password'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student.id).toBe('STU-4001');
    expect(res.body.parent.username).toBe('ota_jasurbek');
    newStudentId = res.body.student.id;
  });

  it('6. Parent logs in and only gets their registered child', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: 'ota_jasurbek', password: 'Ota4001#Password' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('PARENT');
    expect(res.body.user.childrenIds).toContain(newStudentId);
    parentToken = res.body.token;

    // Fetch parent's children
    const myChildren = await request(app)
      .get('/api/v1/parent/my-children')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(myChildren.status).toBe(200);
    expect(myChildren.body.children.length).toBe(1);
    expect(myChildren.body.children[0].id).toBe(newStudentId);
    expect(myChildren.body.children[0].telemetry).toBeDefined();
  });

  it('7. Parent is forbidden (403) from accessing another child telemetry', async () => {
    const res = await request(app)
      .get('/api/v1/parent/child/10001/telemetry') // Another child not belonging to this parent
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
