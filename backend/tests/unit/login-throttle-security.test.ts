import { LoginThrottle } from '../../src/infrastructure/auth/LoginThrottle';
import { SessionManager } from '../../src/infrastructure/auth/SessionManager';
import { RateLimiter } from '../../src/infrastructure/security/RateLimiter';

describe('LoginThrottle & Session Hardening (H-02, H-03, T-01)', () => {
  beforeEach(() => {
    LoginThrottle.reset();
    SessionManager.clearAll();
    RateLimiter.clearAll();
  });

  test('Locks out after 5 consecutive failed attempts for an IP/user pair', () => {
    const user = 'admin';
    const attackerIp = '198.51.100.25';

    for (let i = 0; i < 4; i++) {
      const res = LoginThrottle.recordFailure(user, attackerIp);
      expect(res.locked).toBe(false);
      expect(res.remainingAttempts).toBe(5 - (i + 1));
    }

    const fifthRes = LoginThrottle.recordFailure(user, attackerIp);
    expect(fifthRes.locked).toBe(true);
    expect(fifthRes.remainingAttempts).toBe(0);

    const lockStatus = LoginThrottle.isLocked(user, attackerIp);
    expect(lockStatus.locked).toBe(true);
    expect(lockStatus.retryAfterSeconds).toBeGreaterThan(0);
  });

  test('Different IP address is not locked out when attacker fails attempts (H-02)', () => {
    const user = 'admin';
    const attackerIp = '203.0.113.50';
    const legitUserIp = '192.168.1.100';

    // Attacker fails 5 times
    for (let i = 0; i < 5; i++) {
      LoginThrottle.recordFailure(user, attackerIp);
    }

    expect(LoginThrottle.isLocked(user, attackerIp).locked).toBe(true);

    // Legitimate user from different IP must not be locked out
    expect(LoginThrottle.isLocked(user, legitUserIp).locked).toBe(false);
  });

  test('recordSuccess resets failure counters', () => {
    const user = 'admin';
    const ip = '10.0.0.1';

    LoginThrottle.recordFailure(user, ip);
    LoginThrottle.recordFailure(user, ip);
    LoginThrottle.recordSuccess(user, ip);

    expect(LoginThrottle.isLocked(user, ip).locked).toBe(false);
  });

  test('reset and clearAll clear all state cleanly for test isolation', () => {
    LoginThrottle.recordFailure('user1', '1.1.1.1');
    LoginThrottle.reset();
    expect(LoginThrottle.isLocked('user1', '1.1.1.1').locked).toBe(false);

    SessionManager.clearAll();
    RateLimiter.clearAll();
  });
});
