import request from 'supertest';
import { createApp } from '../../src/app';

describe('Browser & Web Security (Phase 6)', () => {
  const app = createApp();

  describe('HTTP Security Headers', () => {
    test('Injects mandatory protective headers on every response', async () => {
      const res = await request(app).get('/api/status');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['permissions-policy']).toBeDefined();
      expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
      expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
      expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    });
  });

  describe('CORS Restrictions', () => {
    test('Allows whitelisted local origins', async () => {
      const res = await request(app)
        .get('/api/status')
        .set('Origin', 'http://localhost:3000');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    test('Rejects untrusted external origins with error or omits allow-origin', async () => {
      const res = await request(app)
        .get('/api/status')
        .set('Origin', 'https://unauthorized-attacker-site.com');

      // Either CORS blocks with error or does not echo untrusted origin
      if (res.headers['access-control-allow-origin']) {
        expect(res.headers['access-control-allow-origin']).not.toBe('https://unauthorized-attacker-site.com');
        expect(res.headers['access-control-allow-origin']).not.toBe('*');
      } else {
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
      }
    });
  });

  describe('CSRF Origin & Referer Defense', () => {
    test('Blocks state-changing requests when Origin is untrusted', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'https://malicious-external-domain.org')
        .send({ username: 'admin', password: 'Admin@EPAPunjab2026!' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toContain('CSRF');
    });

    test('Blocks state-changing requests when Referer origin is untrusted', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Referer', 'https://phishing-dashboard.com/exploit.html')
        .send({ username: 'admin', password: 'Admin@EPAPunjab2026!' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toContain('CSRF');
    });

    test('Permits state-changing requests when Origin matches allowed list', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send({ username: 'admin', password: 'Admin@EPAPunjab2026!' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });
});
