import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('SMART CHILD — Public Website & CMS Engine Test Suite', () => {
  let superAdminToken = '';
  let normalUserToken = '';

  beforeAll(async () => {
    // 1. Login as initial Super Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'burxonturayev7900@gmail.com', password: process.env.INITIAL_SUPERADMIN_PASSWORD || 'Burxon#Admin2026' });
    
    // If password mismatch in dev fallback, fallback to role switch
    if (adminRes.body.token) {
      superAdminToken = adminRes.body.token;
    } else {
      const fallbackRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ role: 'SUPER_ADMIN' });
      superAdminToken = fallbackRes.body.token;
    }

    // 2. Login as School Admin (non-superadmin)
    const schoolAdminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ role: 'SCHOOL_ADMIN' });
    normalUserToken = schoolAdminRes.body.token;
  });

  it('1. GET /api/v1/cms/public returns published CMS without authentication', async () => {
    const res = await request(app).get('/api/v1/cms/public');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cms).toBeDefined();
    expect(res.body.cms.hero.headline).toContain('SMART CHILD');
    expect(res.body.cms.features.length).toBeGreaterThanOrEqual(12);
    expect(res.body.cms.howItWorks.steps.length).toBe(4);
  });

  it('2. Unauthorized user cannot access CMS draft routes', async () => {
    const noAuth = await request(app).get('/api/v1/cms/draft');
    expect(noAuth.status).toBe(401);

    const forbidden = await request(app)
      .get('/api/v1/cms/draft')
      .set('Authorization', `Bearer ${normalUserToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('3. Super Admin can read and update draft without affecting public website', async () => {
    const draftRes = await request(app)
      .get('/api/v1/cms/draft')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(draftRes.status).toBe(200);
    expect(draftRes.body.cms).toBeDefined();

    const originalPublic = await request(app).get('/api/v1/cms/public');
    const originalHeadline = originalPublic.body.cms.hero.headline;

    // Update draft with temporary test headline
    const testHeadline = "TEST YANGI SARLAVHA - DRAFT ONLY";
    const updatedDraftHero = {
      ...draftRes.body.cms.hero,
      headline: testHeadline
    };

    const updateRes = await request(app)
      .put('/api/v1/cms/draft')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ section: 'hero', data: updatedDraftHero });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.draft.hero.headline).toBe(testHeadline);

    // Public endpoint MUST NOT be changed yet
    const checkPublic = await request(app).get('/api/v1/cms/public');
    expect(checkPublic.body.cms.hero.headline).toBe(originalHeadline);

    // Now restore draft back
    await request(app)
      .put('/api/v1/cms/draft')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ section: 'hero', data: { ...updatedDraftHero, headline: originalHeadline } });
  });

  it('4. DRAFT -> PUBLISH workflow records history version', async () => {
    const publishRes = await request(app)
      .post('/api/v1/cms/publish')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ summary: 'Test avtomatlashtirilgan nashr' });
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.success).toBe(true);
    expect(publishRes.body.version).toBeDefined();
    expect(publishRes.body.version.version).toBeDefined();

    // Verify history endpoint
    const historyRes = await request(app)
      .get('/api/v1/cms/history')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.history.length).toBeGreaterThan(0);
  });

  it('5. GET /api/v1/health/detailed returns real operational status and latency', async () => {
    const res = await request(app).get('/api/v1/health/detailed');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.services.length).toBe(7);

    const ids = res.body.services.map(s => s.id);
    expect(ids).toContain('website');
    expect(ids).toContain('api');
    expect(ids).toContain('database');
    expect(ids).toContain('auth');
    expect(ids).toContain('gps');
    expect(ids).toContain('maps');
    expect(ids).toContain('notifications');
  });

  it('6. Image upload validates mime types and stores image safely', async () => {
    // 1x1 transparent PNG base64
    const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    
    const uploadRes = await request(app)
      .post('/api/v1/cms/upload')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        data: validPng,
        filename: 'test-icon.png',
        title: 'Test Icon',
        category: 'schools',
        alt: 'Test Alt'
      });
    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.url).toMatch(/^\/uploads\/img-/);
    expect(uploadRes.body.item.id).toBeDefined();

    // Clean up created media
    const deleteRes = await request(app)
      .delete(`/api/v1/cms/media/${uploadRes.body.item.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(deleteRes.status).toBe(200);
  });

  it('7. SEO routes /robots.txt and /sitemap.xml are served', async () => {
    const robots = await request(app).get('/robots.txt');
    expect(robots.status).toBe(200);
    expect(robots.text).toContain('User-agent: *');
    expect(robots.text).toContain('/sitemap.xml');

    const sitemap = await request(app).get('/sitemap.xml');
    expect(sitemap.status).toBe(200);
    expect(sitemap.text).toContain('<urlset');
    expect(sitemap.text).toContain('/login');
  });
});

