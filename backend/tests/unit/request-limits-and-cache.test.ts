import request from 'supertest';
import { createApp } from '../../src/app';

describe('Request Limits & Anti-Caching Headers (Item 18, M-03, M-04)', () => {
  const app = createApp();

  it('attaches strict anti-caching headers to API endpoints', async () => {
    const res = await request(app).get('/api/status');
    expect(res.headers['cache-control']).toBe('no-store, no-cache, must-revalidate, proxy-revalidate');
    expect(res.headers['pragma']).toBe('no-cache');
    expect(res.headers['expires']).toBe('0');
  });

  it('rejects oversized JSON request payloads (> 10kb) with 413 Payload Too Large', async () => {
    // Generate a payload exceeding 10KB
    const largeString = 'A'.repeat(15 * 1024); // 15 KB
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: largeString });

    expect(res.status).toBe(413);
  });
});
