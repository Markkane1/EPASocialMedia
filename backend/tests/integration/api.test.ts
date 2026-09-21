import request from 'supertest';
import { createApp } from '../../src/app';

describe('HTTP API Endpoints Integration', () => {
  const app = createApp();
  let adminToken = '';
  let executiveToken = '';

  beforeAll(async () => {
    // Obtain admin token
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@EPAPunjab2026!' });
    adminToken = adminLogin.body.token;

    // Obtain executive token
    const execLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'executive', password: 'Executive@EPAPunjab2026!' });
    executiveToken = execLogin.body.token;
  });

  test('GET /api/status returns 200 OK and healthy service info', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('EPA Punjab');
    expect(res.body.database).toBeDefined();
  });

  test('GET /api/metrics?period=28d returns complete executive KPIs & platforms', async () => {
    const res = await request(app).get('/api/metrics?period=28d');
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.total_followers).toBeGreaterThan(25000);
    expect(res.body.platforms.facebook).toBeDefined();
    expect(res.body.dateRange).toBeDefined();
    expect(res.body.dateRange.days).toBe(28);
  });

  test('GET /api/metrics with dynamic from/to calculates custom duration', async () => {
    const res = await request(app).get('/api/metrics?from=2026-02-01&to=2026-02-14');
    expect(res.status).toBe(200);
    expect(res.body.period).toBe('custom');
    expect(res.body.dateRange.days).toBe(14);
    expect(res.body.dateRange.from).toBe('2026-02-01');
    expect(res.body.dateRange.to).toBe('2026-02-14');
  });

  test('RBAC Security: /api/config requires ADMIN authentication', async () => {
    // 1. Unauthenticated request -> 401
    const resNoAuth = await request(app).get('/api/config');
    expect(resNoAuth.status).toBe(401);

    // 2. Executive (Viewer) token -> 403 Forbidden
    const resExec = await request(app)
      .get('/api/config')
      .set('Authorization', `Bearer ${executiveToken}`);
    expect(resExec.status).toBe(403);

    // 3. Admin token -> 200 OK
    const resAdmin = await request(app)
      .get('/api/config')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resAdmin.status).toBe(200);
    expect(typeof resAdmin.body).toBe('object');
  });

  test('POST /api/test-connection allows Admin to verify platform APIs', async () => {
    const res = await request(app)
      .post('/api/test-connection')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ platform: 'facebook' });
    expect(res.status).toBe(200);
    expect(res.body.platform).toBe('facebook');
  });

  test('POST /api/sync executes live synchronization', async () => {
    const res = await request(app).post('/api/sync').send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.summary).toBeDefined();
    expect(res.body.platforms.facebook).toBeDefined();
  }, 40000);
});
