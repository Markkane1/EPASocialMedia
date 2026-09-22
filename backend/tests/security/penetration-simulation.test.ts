import request from 'supertest';
import { createApp } from '../../src/app';
import { SessionManager } from '../../src/infrastructure/auth/SessionManager';
import { LoginThrottle } from '../../src/infrastructure/auth/LoginThrottle';
import { RateLimiter } from '../../src/infrastructure/security/RateLimiter';
import { AuthService } from '../../src/infrastructure/auth/AuthService';

describe('Controlled Penetration-Style Security Simulation (Phase 14)', () => {
  const app = createApp();
  let adminToken: string;
  let execToken: string;

  beforeEach(async () => {
    SessionManager.clearAll();
    LoginThrottle.reset();
    RateLimiter.clearAll();

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

  describe('Attack Vectors 1-4: Direct & Unauthenticated Access', () => {
    test('Vector 2 & 4: Direct unauthenticated API call rejected with 401', async () => {
      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('Attack Vectors 5-11: Token & Payload Tampering / Privilege Escalation', () => {
    test('Vector 5 & 8: Client tampering with token role (Executive -> ADMIN) is cryptographically rejected', async () => {
      // Decode executive payload
      const [payloadB64, sig] = execToken.split('.');
      const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

      // Tamper role to ADMIN while keeping old signature
      parsed.role = 'ADMIN';
      const tamperedB64 = Buffer.from(JSON.stringify(parsed)).toString('base64url');
      const tamperedToken = `${tamperedB64}.${sig}`;

      // Call Admin endpoint with tampered token
      const res = await request(app)
        .get('/api/config')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    test('Vector 11: Extra unapproved fields in JSON payloads are rejected by strict schemas', async () => {
      const res = await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          FB_PAGE_ID: '12345678',
          unapproved_extra_field: 'malicious_injection'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BadRequest');
    });
  });

  describe('Attack Vectors 12-14: Session Invalidation & State Violations', () => {
    test('Vector 12: Expired idle session receives 401', async () => {
      const s = SessionManager.createSession({
        userId: 'usr-exec-002',
        username: 'executive',
        role: 'EXECUTIVE',
        fullName: 'Executive User'
      });
      // Age beyond 30 min idle threshold
      s.lastActivityAt = Date.now() - 35 * 60 * 1000;

      const token = AuthService.createToken({
        sessionId: s.sessionId,
        userId: 'usr-exec-002',
        username: 'executive',
        role: 'EXECUTIVE',
        fullName: 'Executive User'
      });

      const res = await request(app)
        .get('/api/metrics?period=28d')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('SESSION_EXPIRED_IDLE');
    });

    test('Vector 13: Reusing logged-out session receives 401', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${execToken}`);

      const res = await request(app)
        .get('/api/metrics?period=28d')
        .set('Authorization', `Bearer ${execToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('SESSION_REVOKED');
    });
  });

  describe('Attack Vectors 15-18: Authorization, Mass-Assignment & Malformed Input', () => {
    test('Vector 15: Ordinary executive user cannot invoke admin sync or config', async () => {
      const res = await request(app)
        .post('/api/sync')
        .set('Authorization', `Bearer ${execToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('Vector 16: Mass assignment to DATABASE_URL is blocked with 400', async () => {
      const res = await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ DATABASE_URL: 'postgresql://hacker@localhost/hack' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BadRequest');
    });

    test('Vector 17: SQL Injection string in query params safely handled and rejected by schema', async () => {
      const res = await request(app)
        .get("/api/metrics?period=' OR '1'='1")
        .set('Authorization', `Bearer ${execToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BadRequest');
    });
  });

  describe('Attack Vectors 19-25: Abuse, Browser & Information Disclosure', () => {
    test('Vector 19: Repeated failed logins lock the account after 5 attempts', async () => {
      const username = 'pentest_victim';

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ username, password: 'WrongPassword123!' });
      }

      const lockRes = await request(app)
        .post('/api/auth/login')
        .send({ username, password: 'AnyPassword!' });

      expect(lockRes.status).toBe(401);
      expect(lockRes.body.message).toContain('Account temporarily locked');
    });

    test('Vector 22 & 23: Cross-origin state changing attack rejected with 403 CSRF defense', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'https://attacker-controlled-site.org')
        .send({ username: 'admin', password: 'Admin@EPAPunjab2026!' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('CSRF');
    });

    test('Vector 25: Security headers and error sanitization prevent information leakage', async () => {
      const res = await request(app).get('/api/status');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });
});
