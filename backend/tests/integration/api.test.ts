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

  test('GET /api/status returns 200 OK for anonymous users (Public Health Check)', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('EPA Punjab');
    expect(res.body.database).toBeDefined();
  });

  test('GET /api/metrics rejects anonymous access with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/metrics?period=28d');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('GET /api/metrics rejects tampered or invalid tokens with 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/metrics?period=28d')
      .set('Authorization', 'Bearer invalid.tampered.token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('GET /api/metrics?period=28d succeeds with authenticated token', async () => {
    const res = await request(app)
      .get('/api/metrics?period=28d')
      .set('Authorization', `Bearer ${executiveToken}`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.total_followers).toBeGreaterThan(25000);
    expect(res.body.platforms.facebook).toBeDefined();
    expect(res.body.dateRange).toBeDefined();
    expect(res.body.dateRange.days).toBe(28);
  });

  test('GET /api/metrics with dynamic from/to calculates custom duration when authenticated', async () => {
    const res = await request(app)
      .get('/api/metrics?from=2026-02-01&to=2026-02-14')
      .set('Authorization', `Bearer ${executiveToken}`);
    expect(res.status).toBe(200);
    expect(res.body.period).toBe('custom');
    expect(res.body.dateRange.days).toBe(14);
    expect(res.body.dateRange.from).toBe('2026-02-01');
    expect(res.body.dateRange.to).toBe('2026-02-14');
  });

  test('POST /api/sync rejects anonymous access with 401 Unauthorized', async () => {
    const res = await request(app).post('/api/sync').send({});
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('POST /api/sync rejects EXECUTIVE access with 403 Forbidden (TRIGGER_SYNC restricted)', async () => {
    const res = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${executiveToken}`)
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
    expect(res.body.message).toContain('TRIGGER_SYNC');
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

  test('POST /api/config rejects mass-assignment attempts on DATABASE_URL or unauthorized keys with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ DATABASE_URL: 'postgresql://malicious_host:5432/db' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('BadRequest');
  });

  test('POST /api/config accepts valid platform configuration updates', async () => {
    const res = await request(app)
      .post('/api/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ X_USERNAME: '@epapunjab' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  test('GET /api/metrics rejects malformed date parameters with 400 Bad Request', async () => {
    const res = await request(app)
      .get('/api/metrics?from=invalid-date')
      .set('Authorization', `Bearer ${executiveToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('BadRequest');
  });

  test('POST /api/test-connection allows Admin to verify platform APIs', async () => {
    const res = await request(app)
      .post('/api/test-connection')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ platform: 'facebook' });
    expect(res.status).toBe(200);
    expect(res.body.platform).toBe('facebook');
  });

  test('POST /api/sync executes live synchronization when authenticated', async () => {
    const res = await request(app)
      .post('/api/sync')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.summary).toBeDefined();
    expect(res.body.platforms.facebook).toBeDefined();
  }, 40000);

  test('POST /api/auth/logout invalidates session and prevents token reuse', async () => {
    // 1. Log in to get fresh session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'executive', password: 'Executive@EPAPunjab2026!' });
    const freshToken = loginRes.body.token;

    // 2. Token works
    const metricsBefore = await request(app)
      .get('/api/metrics?period=28d')
      .set('Authorization', `Bearer ${freshToken}`);
    expect(metricsBefore.status).toBe(200);

    // 3. Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${freshToken}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.status).toBe('success');

    // 4. Token cannot be reused (Server returns 401 Unauthorized)
    const metricsAfter = await request(app)
      .get('/api/metrics?period=28d')
      .set('Authorization', `Bearer ${freshToken}`);
    expect(metricsAfter.status).toBe(401);
    expect(metricsAfter.body.code).toBe('SESSION_REVOKED');
  });

  test('POST /api/auth/change-password validates complexity, verifies current password, and revokes sessions', async () => {
    // 1. Log in to get active session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'executive', password: 'Executive@EPAPunjab2026!' });
    const sessionToken = loginRes.body.token;

    // 2. Reject weak password (lacks uppercase / digit / too short)
    const weakRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ currentPassword: 'Executive@EPAPunjab2026!', newPassword: 'weak' });
    expect(weakRes.status).toBe(400);

    // 3. Reject invalid current password
    const wrongCurrentRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ currentPassword: 'WrongPassword123!', newPassword: 'NewExecutivePass2026!' });
    expect(wrongCurrentRes.status).toBe(400);
    expect(wrongCurrentRes.body.message).toContain('Current password does not match');

    // 4. Successfully change password
    const successRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ currentPassword: 'Executive@EPAPunjab2026!', newPassword: 'NewExecutivePass2026!' });
    expect(successRes.status).toBe(200);

    // 5. Active session must now be revoked
    const postChangeReq = await request(app)
      .get('/api/metrics?period=28d')
      .set('Authorization', `Bearer ${sessionToken}`);
    expect(postChangeReq.status).toBe(401);
    expect(postChangeReq.body.code).toBe('SESSION_REVOKED');

    // 6. Restore original password for consistency in further test runs
    const relogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'executive', password: 'NewExecutivePass2026!' });
    expect(relogin.status).toBe(200);

    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${relogin.body.token}`)
      .send({ currentPassword: 'NewExecutivePass2026!', newPassword: 'Executive@EPAPunjab2026!' });
  });
});

