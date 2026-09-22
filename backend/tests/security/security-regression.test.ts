import request from 'supertest';
import { createApp } from '../../src/app';
import { SessionManager } from '../../src/infrastructure/auth/SessionManager';
import { LoginThrottle } from '../../src/infrastructure/auth/LoginThrottle';
import { RateLimiter } from '../../src/infrastructure/security/RateLimiter';
import { SecurityAuditLogger } from '../../src/infrastructure/logging/SecurityAuditLogger';

describe('Comprehensive Security Regression Suite (Phase 13)', () => {
  const app = createApp();
  let adminToken: string;
  let execToken: string;

  beforeEach(async () => {
    SessionManager.clearAll();
    LoginThrottle.reset();
    RateLimiter.clearAll();
    SecurityAuditLogger.clearAll();

    // Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@EPAPunjab2026!' });
    adminToken = adminRes.body.token;

    // Authenticate Executive
    const execRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'executive', password: 'Executive@EPAPunjab2026!' });
    execToken = execRes.body.token;
  });

  describe('1. Authentication Boundary Enforcement', () => {
    test('Anonymous requests to protected endpoints return 401 Unauthorized', async () => {
      const endpoints = [
        { method: 'get', path: '/api/metrics' },
        { method: 'post', path: '/api/sync' },
        { method: 'get', path: '/api/config' },
        { method: 'post', path: '/api/config' },
        { method: 'get', path: '/api/users' },
        { method: 'get', path: '/api/audit-logs' },
        { method: 'post', path: '/api/auth/change-password' }
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.path);
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Unauthorized');
      }
    });

    test('Cryptographically tampered or forged tokens return 401 Unauthorized', async () => {
      const forgedToken = `${adminToken.substring(0, adminToken.length - 8)}TAMPERED`;
      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    test('Corrupted authorization header schemas return 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Server-Enforced RBAC & Privilege Separation', () => {
    test('EXECUTIVE role is restricted to VIEW_METRICS only and receives 403 on admin routes', async () => {
      // Allowed: Metrics
      const metricsRes = await request(app)
        .get('/api/metrics?period=28d')
        .set('Authorization', `Bearer ${execToken}`);
      expect(metricsRes.status).toBe(200);

      // Forbidden: Scraper Sync
      const syncRes = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${execToken}`);
      expect(syncRes.status).toBe(403);
      expect(syncRes.body.code).toBe('INSUFFICIENT_PERMISSIONS');

      // Forbidden: Configuration
      const configGet = await request(app)
        .get('/api/config')
        .set('Authorization', `Bearer ${execToken}`);
      expect(configGet.status).toBe(403);

      const configPost = await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${execToken}`)
        .send({ FB_PAGE_ID: '123' });
      expect(configPost.status).toBe(403);

      // Forbidden: User Management
      const usersRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${execToken}`);
      expect(usersRes.status).toBe(403);

      // Forbidden: Audit Logs
      const auditRes = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${execToken}`);
      expect(auditRes.status).toBe(403);
    });

    test('ADMIN role has all system permissions', async () => {
      const configRes = await request(app)
        .get('/api/config')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(configRes.status).toBe(200);

      const usersRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(usersRes.status).toBe(200);

      const auditRes = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(auditRes.status).toBe(200);
    });
  });

  describe('3. Session Lifecycle & Invalidation Guarantees', () => {
    test('Logged out token cannot be reused', async () => {
      // 1. Fresh login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'executive', password: 'Executive@EPAPunjab2026!' });
      const token = loginRes.body.token;

      // 2. Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(logoutRes.status).toBe(200);

      // 3. Re-use token fails
      const reattempt = await request(app)
        .get('/api/metrics?period=28d')
        .set('Authorization', `Bearer ${token}`);
      expect(reattempt.status).toBe(401);
      expect(reattempt.body.code).toBe('SESSION_REVOKED');
    });

    test('Password change invalidates all existing sessions for the target user', async () => {
      // 1. Executive logs in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'executive', password: 'Executive@EPAPunjab2026!' });
      const token = loginRes.body.token;

      // 2. Change password
      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'Executive@EPAPunjab2026!', newPassword: 'StrongNewPass2026!' });
      expect(changeRes.status).toBe(200);

      // 3. Old session token immediately rejected
      const metricsAttempt = await request(app)
        .get('/api/metrics?period=28d')
        .set('Authorization', `Bearer ${token}`);
      expect(metricsAttempt.status).toBe(401);
      expect(metricsAttempt.body.code).toBe('SESSION_REVOKED');

      // 4. Restore original password for ongoing test runs
      const relogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'executive', password: 'StrongNewPass2026!' });
      expect(relogin.status).toBe(200);

      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${relogin.body.token}`)
        .send({ currentPassword: 'StrongNewPass2026!', newPassword: 'Executive@EPAPunjab2026!' });
    });
  });

  describe('4. Input Validation & Mass Assignment Defenses', () => {
    test('Rejects mass assignment attempts modifying environment or sensitive keys', async () => {
      const res = await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          DATABASE_URL: 'postgresql://attacker:pass@evil.com/db',
          JWT_SECRET: 'evil_override'
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BadRequest');
    });

    test('Rejects malformed date inputs on metrics endpoint', async () => {
      const res = await request(app)
        .get('/api/metrics?from=2026-99-99&to=invalid')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BadRequest');
    });
  });
});
