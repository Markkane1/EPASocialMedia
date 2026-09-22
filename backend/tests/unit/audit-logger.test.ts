import request from 'supertest';
import { SecurityAuditLogger } from '../../src/infrastructure/logging/SecurityAuditLogger';
import { createApp } from '../../src/app';
import { AuthService } from '../../src/infrastructure/auth/AuthService';
import { SessionManager } from '../../src/infrastructure/auth/SessionManager';

describe('Security Audit Logging (Phase 10)', () => {
  beforeEach(() => {
    SecurityAuditLogger.clearAll();
    SessionManager.clearAll();
  });

  describe('SecurityAuditLogger Core Engine', () => {
    test('Records audit events with actor, action, result and resource', () => {
      const entry = SecurityAuditLogger.record({
        actor: 'admin',
        action: 'CONFIG_UPDATED',
        resource: '/api/config',
        result: 'SUCCESS',
        ipAddress: '192.168.1.10',
        metadata: { updatedKeys: ['FB_PAGE_ID'] }
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.actor).toBe('admin');
      expect(entry.action).toBe('CONFIG_UPDATED');
      expect(entry.result).toBe('SUCCESS');

      const logs = SecurityAuditLogger.getRecentLogs(10);
      expect(logs.length).toBe(1);
      expect(logs[0].id).toBe(entry.id);
    });

    test('Redacts passwords, tokens and secrets from metadata', () => {
      const entry = SecurityAuditLogger.record({
        actor: 'admin',
        action: 'USER_LOGIN',
        resource: '/api/auth/login',
        result: 'FAILURE',
        metadata: {
          submittedPassword: 'SuperSecretPassword123!',
          bearerToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          allowedKey: 'safe-public-param'
        }
      });

      expect(entry.metadata?.submittedPassword).toBe('[REDACTED]');
      expect(entry.metadata?.bearerToken).toBe('[REDACTED]');
      expect(entry.metadata?.allowedKey).toBe('safe-public-param');
    });
  });

  describe('Audit Log HTTP Endpoint Access Control', () => {
    const app = createApp();

    test('Rejects anonymous access with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/audit-logs');
      expect(res.status).toBe(401);
    });

    test('Rejects EXECUTIVE access with 403 Forbidden', async () => {
      const s = SessionManager.createSession({
        userId: 'usr-exec-002',
        username: 'executive',
        role: 'EXECUTIVE',
        fullName: 'Executive User'
      });
      const token = AuthService.createToken({
        sessionId: s.sessionId,
        userId: 'usr-exec-002',
        username: 'executive',
        role: 'EXECUTIVE',
        fullName: 'Executive User'
      });

      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    test('Allows ADMIN access with 200 OK and returns logs', async () => {
      const s = SessionManager.createSession({
        userId: 'usr-admin-001',
        username: 'admin',
        role: 'ADMIN',
        fullName: 'Admin User'
      });
      const token = AuthService.createToken({
        sessionId: s.sessionId,
        userId: 'usr-admin-001',
        username: 'admin',
        role: 'ADMIN',
        fullName: 'Admin User'
      });

      // Populate dummy audit event
      SecurityAuditLogger.record({
        actor: 'system',
        action: 'HEALTH_CHECK',
        resource: '/api/status',
        result: 'SUCCESS'
      });

      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.logs.length).toBeGreaterThan(0);
    });
  });
});
