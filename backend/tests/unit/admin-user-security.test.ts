import request from 'supertest';
import { createApp } from '../../src/app';
import { SessionManager } from '../../src/infrastructure/auth/SessionManager';

describe('User & Administrative Security Guardrails (Phase 11)', () => {
  const app = createApp();
  let adminToken: string;
  let execToken: string;

  beforeEach(async () => {
    SessionManager.clearAll();

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@EPAPunjab2026!' });
    adminToken = adminRes.body.token;

    // Login Executive
    const execRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'executive', password: 'Executive@EPAPunjab2026!' });
    execToken = execRes.body.token;
  });

  describe('User Listing & Sensitive Field Sanitization', () => {
    test('Barred from anonymous or EXECUTIVE access', async () => {
      const anonRes = await request(app).get('/api/users');
      expect(anonRes.status).toBe(401);

      const execRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${execToken}`);
      expect(execRes.status).toBe(403);
    });

    test('ADMIN retrieves user list with password hashes stripped', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThanOrEqual(2);

      for (const u of res.body.users) {
        expect(u.passwordHash).toBeUndefined();
        expect(u.username).toBeDefined();
        expect(u.role).toBeDefined();
        expect(u.isActive).toBeDefined();
      }
    });
  });

  describe('Administrative Lockout Protection Guardrail', () => {
    test('Prevents disabling the only active administrator account', async () => {
      const res = await request(app)
        .post('/api/users/admin/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BadRequest');
      expect(res.body.message).toContain('Cannot disable the last active administrator');
    });
  });

  describe('Account Disablement & Active Session Revocation', () => {
    test('Disabling a user revokes active sessions and prevents further access', async () => {
      // 1. Verify executive can access metrics before disablement
      const beforeRes = await request(app)
        .get('/api/metrics?period=28d')
        .set('Authorization', `Bearer ${execToken}`);
      expect(beforeRes.status).toBe(200);

      // 2. Admin disables executive account
      const disableRes = await request(app)
        .post('/api/users/executive/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });
      expect(disableRes.status).toBe(200);

      // 3. Executive active session token is immediately revoked
      const afterRes = await request(app)
        .get('/api/metrics?period=28d')
        .set('Authorization', `Bearer ${execToken}`);
      expect(afterRes.status).toBe(401);
      expect(afterRes.body.code).toBe('SESSION_REVOKED');

      // 4. Executive cannot log in while disabled
      const loginAttempt = await request(app)
        .post('/api/auth/login')
        .send({ username: 'executive', password: 'Executive@EPAPunjab2026!' });
      expect(loginAttempt.status).toBe(401);
      expect(loginAttempt.body.message).toContain('Account is disabled');

      // 5. Restore executive account for future tests
      await request(app)
        .post('/api/users/executive/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
    });
  });
});
