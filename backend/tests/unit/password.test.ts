import { LoginThrottle } from '../../src/infrastructure/auth/LoginThrottle';
import { AuthUseCase } from '../../src/application/use-cases/AuthUseCase';
import { PrismaUserRepository } from '../../src/infrastructure/database/PrismaUserRepository';
import { AuthService } from '../../src/infrastructure/auth/AuthService';
import { SessionManager } from '../../src/infrastructure/auth/SessionManager';

describe('Password, Account & Recovery Security (Phase 5)', () => {
  let userRepo: PrismaUserRepository;
  let authUseCase: AuthUseCase;

  beforeEach(() => {
    LoginThrottle.reset();
    SessionManager.clearAll();
    userRepo = new PrismaUserRepository();
    authUseCase = new AuthUseCase(userRepo);
  });

  describe('Login Throttle & Brute-Force Defense', () => {
    test('Locks account after 5 consecutive failed attempts', () => {
      const username = 'throttletest';

      for (let i = 0; i < 4; i++) {
        const attempt = LoginThrottle.recordFailure(username);
        expect(attempt.locked).toBe(false);
        expect(attempt.remainingAttempts).toBe(4 - i);
      }

      // 5th failure triggers lock
      const fifthAttempt = LoginThrottle.recordFailure(username);
      expect(fifthAttempt.locked).toBe(true);
      expect(fifthAttempt.retryAfterSeconds).toBeGreaterThan(0);

      // Subsequent checks confirm lock
      const check = LoginThrottle.isLocked(username);
      expect(check.locked).toBe(true);
      expect(check.retryAfterSeconds).toBeGreaterThan(0);
    });

    test('Successful login clears failed attempts counter', () => {
      const username = 'resumetest';

      LoginThrottle.recordFailure(username);
      LoginThrottle.recordFailure(username);
      expect(LoginThrottle.isLocked(username).locked).toBe(false);

      LoginThrottle.recordSuccess(username);

      // Now 5 fresh attempts are required to lock
      for (let i = 0; i < 4; i++) {
        const attempt = LoginThrottle.recordFailure(username);
        expect(attempt.locked).toBe(false);
      }
    });

    test('AuthUseCase rejects login immediately when account is locked', async () => {
      const username = 'admin';

      // Exhaust attempts
      for (let i = 0; i < 5; i++) {
        await authUseCase.login(username, 'WrongPassword123!');
      }

      // Attempt with correct password while locked
      const result = await authUseCase.login(username, 'Admin@EPAPunjab2026!');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Account temporarily locked');
    });
  });

  describe('Account Disablement Defense', () => {
    test('Disabled account (isActive: false) cannot log in even with valid credentials', async () => {
      const admin = await userRepo.findByUsername('admin');
      expect(admin).not.toBeNull();

      // Disable account
      const disabledAdmin = admin!.withActiveStatus(false);
      await userRepo.saveUser(disabledAdmin);

      const result = await authUseCase.login('admin', 'Admin@EPAPunjab2026!');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Account is disabled');
    });
  });

  describe('Password Change & Session Invalidation', () => {
    test('Fails password change if current password is wrong', async () => {
      const result = await authUseCase.changePassword('admin', 'WrongPass123', 'NewSecurePass2026!');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Current password does not match');
    });

    test('Successfully updates password and revokes all active sessions for the user', async () => {
      // 1. Initial login
      const login1 = await authUseCase.login('admin', 'Admin@EPAPunjab2026!');
      expect(login1.success).toBe(true);
      expect(login1.sessionId).toBeDefined();

      // Session is active
      expect(SessionManager.validateSession(login1.sessionId!).valid).toBe(true);

      // 2. Change password
      const changeRes = await authUseCase.changePassword(
        'admin',
        'Admin@EPAPunjab2026!',
        'NewEPAStrongPass2026!'
      );
      expect(changeRes.success).toBe(true);

      // 3. Old session MUST be invalidated
      const sessionCheck = SessionManager.validateSession(login1.sessionId!);
      expect(sessionCheck.valid).toBe(false);
      expect(sessionCheck.error).toBe('SESSION_REVOKED');

      // 4. Old password can no longer authenticate
      const oldLogin = await authUseCase.login('admin', 'Admin@EPAPunjab2026!');
      expect(oldLogin.success).toBe(false);

      // 5. New password authenticates successfully
      const newLogin = await authUseCase.login('admin', 'NewEPAStrongPass2026!');
      expect(newLogin.success).toBe(true);
      expect(newLogin.token).toBeDefined();
    });
  });
});
