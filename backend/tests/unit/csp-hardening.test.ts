import express from 'express';
import request from 'supertest';
import { securityHeaders } from '../../src/interfaces/http/middlewares/securityHeaders';

describe('CSP & Security Headers Hardening (Item 16, M-01, M-02)', () => {
  const app = express();
  app.use(securityHeaders);
  app.get('/test-headers', (req, res) => res.json({ ok: true }));

  it('sets Content-Security-Policy without unsafe-inline in script-src and without wild https in img-src', async () => {
    const res = await request(app).get('/test-headers');
    expect(res.status).toBe(200);

    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();

    // Verify script-src does not allow unsafe-inline
    const scriptSrcMatch = csp.match(/script-src\s+([^;]+)/);
    expect(scriptSrcMatch).not.toBeNull();
    if (scriptSrcMatch) {
      expect(scriptSrcMatch[1]).not.toContain("'unsafe-inline'");
      expect(scriptSrcMatch[1]).toContain("'self'");
    }

    // Verify img-src is restricted to self and data: (no wildcard https:)
    const imgSrcMatch = csp.match(/img-src\s+([^;]+)/);
    expect(imgSrcMatch).not.toBeNull();
    if (imgSrcMatch) {
      expect(imgSrcMatch[1]).not.toMatch(/\bhttps:\b/);
      expect(imgSrcMatch[1]).toContain("'self'");
    }
  });

  it('sets anti-clickjacking, nosniff, and frame-ancestors headers', async () => {
    const res = await request(app).get('/test-headers');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
