import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClientSingleton } from '../../src/infrastructure/database/PrismaClientSingleton';

describe('Operational Health Probes & Information Disclosure (Item 22, M-05)', () => {
  const app = createApp();

  afterEach(() => {
    PrismaClientSingleton.reset();
  });

  it('/api/health/liveness returns HTTP 200 UP without internal dependencies', async () => {
    const res = await request(app).get('/api/health/liveness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.database).toBeUndefined();
    expect(res.body.engine).toBeUndefined();
  });

  it('/api/health/readiness returns READY when connected and NOT_READY with 503 when disconnected', async () => {
    // 1. Mock DB connected
    (PrismaClientSingleton as any).isConnected = true;
    const resReady = await request(app).get('/api/health/readiness');
    expect(resReady.status).toBe(200);
    expect(resReady.body.status).toBe('READY');
    expect(resReady.body.database).toBeUndefined();

    // 2. Mock DB disconnected
    (PrismaClientSingleton as any).isConnected = false;
    const resNotReady = await request(app).get('/api/health/readiness');
    expect(resNotReady.status).toBe(503);
    expect(resNotReady.body.status).toBe('NOT_READY');
  });

  it('unauthenticated /api/health redacts internal implementation details (PostgreSQL, Prisma)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.database).toBeUndefined();
    expect(res.body.orm).toBeUndefined();
    expect(res.body.version).toBeUndefined();
  });
});
