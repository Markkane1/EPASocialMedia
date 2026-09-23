import { SessionManager } from '../../src/infrastructure/auth/SessionManager';
import { RateLimiter } from '../../src/infrastructure/security/RateLimiter';
import { LoginThrottle } from '../../src/infrastructure/auth/LoginThrottle';
import { SecurityAuditLogger } from '../../src/infrastructure/logging/SecurityAuditLogger';
import { PrismaClientSingleton } from '../../src/infrastructure/database/PrismaClientSingleton';

describe('Test Harness Helper Integrity (Item 13, T-01, T-02)', () => {
  it('SessionManager exposes clearAll() and getSession() without throwing', () => {
    expect(typeof SessionManager.clearAll).toBe('function');
    expect(typeof SessionManager.getSession).toBe('function');

    const session = SessionManager.createSession({
      userId: 'u1',
      username: 'user1',
      role: 'ADMIN',
      fullName: 'User One'
    });
    expect(SessionManager.getSession(session.sessionId)).toBeDefined();

    SessionManager.clearAll();
    expect(SessionManager.getSession(session.sessionId)).toBeUndefined();
  });

  it('RateLimiter exposes clearAll() without throwing', () => {
    expect(typeof RateLimiter.clearAll).toBe('function');
    RateLimiter.clearAll();
  });

  it('LoginThrottle exposes reset() without throwing', () => {
    expect(typeof LoginThrottle.reset).toBe('function');
    LoginThrottle.recordFailedAttempt('testuser', '127.0.0.1');
    expect(LoginThrottle.isLocked('testuser', '127.0.0.1').locked).toBe(false);
    LoginThrottle.reset();
  });

  it('SecurityAuditLogger exposes clearAll() and getRecentLogs() without throwing', () => {
    expect(typeof SecurityAuditLogger.clearAll).toBe('function');
    expect(typeof SecurityAuditLogger.getRecentLogs).toBe('function');

    SecurityAuditLogger.record({
      actor: 'admin',
      action: 'TEST_ACTION',
      resource: '/test',
      result: 'SUCCESS'
    });
    expect(SecurityAuditLogger.getRecentLogs(10).length).toBeGreaterThan(0);

    SecurityAuditLogger.clearAll();
    expect(SecurityAuditLogger.getRecentLogs(10).length).toBe(0);
  });

  it('PrismaClientSingleton exposes reset() and forceReconnect()', () => {
    expect(typeof PrismaClientSingleton.reset).toBe('function');
    expect(typeof PrismaClientSingleton.forceReconnect).toBe('function');
  });
});
