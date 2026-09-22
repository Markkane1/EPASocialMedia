import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../src/interfaces/http/middlewares/errorHandler';

describe('Input Validation, Error Handling & Information Disclosure (Phase 7)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('Production error response does not expose stack traces or internal implementation details', async () => {
    process.env.NODE_ENV = 'production';

    const testApp = express();
    testApp.get('/test-error', () => {
      const err: any = new Error('Database query failed: SELECT * FROM users WHERE password_hash = ...');
      err.status = 500;
      throw err;
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-error');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('InternalServerError');
    expect(res.body.stack).toBeUndefined();
    expect(res.body.message).not.toContain('SELECT * FROM');
    expect(res.body.message).toContain('An internal server error occurred');
  });

  test('Sanitizes database credentials and tokens if present in error message', async () => {
    process.env.NODE_ENV = 'development';

    const testApp = express();
    testApp.get('/test-leak', () => {
      const err: any = new Error('Connection failed to postgres://admin:SuperSecretPass123@localhost:5432/epadb');
      err.status = 500;
      throw err;
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-leak');

    expect(res.status).toBe(500);
    expect(res.body.message).not.toContain('SuperSecretPass123');
    expect(res.body.message).toContain('[REDACTED_CREDENTIALS]');
  });

  test('Preserves client-safe error messages for 4xx bad requests', async () => {
    const testApp = express();
    testApp.get('/test-client-err', () => {
      const err: any = new Error('Invalid date filter range');
      err.status = 400;
      throw err;
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-client-err');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('BadRequest');
    expect(res.body.message).toBe('Invalid date filter range');
  });
});
