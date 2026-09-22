import { SessionManager } from '../../src/infrastructure/auth/SessionManager';

describe('Session Lifecycle and Expiration (SessionManager)', () => {
  beforeEach(() => {
    SessionManager.clearAll();
  });

  test('Session creation: creates valid active session with metadata', () => {
    const session = SessionManager.createSession({
      userId: 'usr-001',
      username: 'testadmin',
      role: 'ADMIN',
      fullName: 'Test Administrator'
    });

    expect(session.sessionId).toBeDefined();
    expect(session.isRevoked).toBe(false);
    expect(session.createdAt).toBeGreaterThan(0);
    expect(session.lastActivityAt).toBe(session.createdAt);

    const validation = SessionManager.validateSession(session.sessionId);
    expect(validation.valid).toBe(true);
    expect(validation.session?.username).toBe('testadmin');
  });

  test('Idle timeout: expires session after inactivity exceeds threshold', () => {
    const session = SessionManager.createSession({
      userId: 'usr-002',
      username: 'inactivetest',
      role: 'EXECUTIVE',
      fullName: 'Inactive User'
    });

    // Artificially age lastActivityAt past idle timeout (31 minutes ago)
    session.lastActivityAt = Date.now() - (31 * 60 * 1000);

    const validation = SessionManager.validateSession(session.sessionId);
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('SESSION_EXPIRED_IDLE');
    expect(validation.message).toContain('inactivity');

    // Confirms session is now marked revoked
    expect(SessionManager.getSession(session.sessionId)?.isRevoked).toBe(true);
  });

  test('Absolute lifetime: expires session once maximum lifespan is reached even if active', () => {
    const session = SessionManager.createSession({
      userId: 'usr-003',
      username: 'longlived',
      role: 'EXECUTIVE',
      fullName: 'Long Lived User'
    });

    // Artificially age createdAt past 8 hours (8 hours 1 minute ago)
    session.createdAt = Date.now() - (8 * 3600 * 1000 + 60000);
    session.lastActivityAt = Date.now(); // active right now

    const validation = SessionManager.validateSession(session.sessionId);
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('SESSION_EXPIRED_ABSOLUTE');
    expect(validation.message).toContain('maximum absolute lifetime');
  });

  test('Logout invalidation: revoking session prevents any further access', () => {
    const session = SessionManager.createSession({
      userId: 'usr-004',
      username: 'logoutuser',
      role: 'EXECUTIVE',
      fullName: 'Logout User'
    });

    // Verify valid before logout
    expect(SessionManager.validateSession(session.sessionId).valid).toBe(true);

    // Perform logout revocation
    const revoked = SessionManager.revokeSession(session.sessionId, 'USER_LOGOUT');
    expect(revoked).toBe(true);

    // Verify rejected after logout
    const validation = SessionManager.validateSession(session.sessionId);
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('SESSION_REVOKED');
  });

  test('Security-sensitive invalidation: revokes all sessions on password change or account disablement', () => {
    const s1 = SessionManager.createSession({
      userId: 'target-user',
      username: 'target',
      role: 'EXECUTIVE',
      fullName: 'Target User'
    });

    const s2 = SessionManager.createSession({
      userId: 'target-user',
      username: 'target',
      role: 'EXECUTIVE',
      fullName: 'Target User'
    });

    const otherSession = SessionManager.createSession({
      userId: 'other-user',
      username: 'other',
      role: 'ADMIN',
      fullName: 'Other User'
    });

    // Revoke all sessions for target user
    const count = SessionManager.revokeAllUserSessions('target-user', 'PASSWORD_CHANGED');
    expect(count).toBe(2);

    // Target sessions are invalidated
    expect(SessionManager.validateSession(s1.sessionId).valid).toBe(false);
    expect(SessionManager.validateSession(s2.sessionId).valid).toBe(false);

    // Unrelated user session remains valid
    expect(SessionManager.validateSession(otherSession.sessionId).valid).toBe(true);
  });
});
