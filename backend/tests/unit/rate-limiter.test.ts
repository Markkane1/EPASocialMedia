import request from 'supertest';
import express from 'express';
import { RateLimiter } from '../../src/infrastructure/security/RateLimiter';

describe('Rate Limiting & Abuse Protection (Phase 9)', () => {
  beforeEach(() => {
    RateLimiter.clearAll();
  });

  test('Permits requests within limit and attaches rate limit headers', async () => {
    const testApp = express();
    const limiter = RateLimiter.create({ windowMs: 10000, max: 3 });
    testApp.get('/test-limit', limiter, (req, res) => res.json({ success: true }));

    const res1 = await request(testApp).get('/test-limit');
    expect(res1.status).toBe(200);
    expect(res1.headers['ratelimit-limit']).toBe('3');
    expect(res1.headers['ratelimit-remaining']).toBe('2');

    const res2 = await request(testApp).get('/test-limit');
    expect(res2.status).toBe(200);
    expect(res2.headers['ratelimit-remaining']).toBe('1');
  });

  test('Enforces 429 Too Many Requests when threshold is exceeded', async () => {
    const testApp = express();
    const limiter = RateLimiter.create({
      windowMs: 10000,
      max: 2,
      message: 'Rate limit test exceeded.'
    });
    testApp.get('/test-throttle', limiter, (req, res) => res.json({ ok: true }));

    // Request 1 & 2 pass
    await request(testApp).get('/test-throttle');
    await request(testApp).get('/test-throttle');

    // Request 3 is throttled
    const blockedRes = await request(testApp).get('/test-throttle');
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error).toBe('TooManyRequests');
    expect(blockedRes.body.message).toContain('Rate limit test exceeded');
    expect(blockedRes.headers['retry-after']).toBeDefined();
  });

  test('Resets count after window expires', async () => {
    const testApp = express();
    const limiter = RateLimiter.create({ windowMs: 100, max: 1 });
    testApp.get('/test-reset', limiter, (req, res) => res.json({ ok: true }));

    const res1 = await request(testApp).get('/test-reset');
    expect(res1.status).toBe(200);

    const res2 = await request(testApp).get('/test-reset');
    expect(res2.status).toBe(429);

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 120));

    const res3 = await request(testApp).get('/test-reset');
    expect(res3.status).toBe(200);
  });
});
