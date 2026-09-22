import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AuthService, TokenPayload } from '../../infrastructure/auth/AuthService';
import { SessionManager } from '../../infrastructure/auth/SessionManager';
import { LoginThrottle } from '../../infrastructure/auth/LoginThrottle';
import { UserRoleType } from '../../domain/entities/User';
import { SecurityAuditLogger } from '../../infrastructure/logging/SecurityAuditLogger';

export interface LoginResult {
  success: boolean;
  message: string;
  token?: string;
  sessionId?: string;
  user?: {
    id?: string;
    username: string;
    fullName: string;
    role: UserRoleType;
  };
}

export class AuthUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  public async login(
    username: string,
    password: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<LoginResult> {
    if (!username || !password) {
      return {
        success: false,
        message: 'Username and password are required.'
      };
    }

    const cleanUsername = username.trim().toLowerCase();

    // 1. Check Brute-Force Rate Limiting / Lockout
    const lockCheck = LoginThrottle.isLocked(cleanUsername);
    if (lockCheck.locked) {
      SecurityAuditLogger.record({
        actor: cleanUsername,
        action: 'ACCOUNT_LOCKED',
        resource: '/api/auth/login',
        result: 'BLOCKED',
        ipAddress: metadata?.ipAddress
      });
      return {
        success: false,
        message: `Account temporarily locked due to repeated failed login attempts. Try again in ${lockCheck.retryAfterSeconds} seconds.`
      };
    }

    const user = await this.userRepo.findByUsername(cleanUsername);
    if (!user) {
      LoginThrottle.recordFailure(cleanUsername);
      SecurityAuditLogger.record({
        actor: cleanUsername,
        action: 'LOGIN_FAILURE',
        resource: '/api/auth/login',
        result: 'FAILURE',
        ipAddress: metadata?.ipAddress,
        metadata: { reason: 'USER_NOT_FOUND' }
      });
      return {
        success: false,
        message: 'Invalid username or password.'
      };
    }

    // 2. Check Account Disablement
    if (!user.isActive) {
      SecurityAuditLogger.record({
        actor: cleanUsername,
        action: 'LOGIN_BLOCKED_DISABLED',
        resource: '/api/auth/login',
        result: 'BLOCKED',
        ipAddress: metadata?.ipAddress
      });
      return {
        success: false,
        message: 'Account is disabled. Please contact system administrator.'
      };
    }

    // 3. Verify Password Hash
    const isValid = AuthService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      const failRecord = LoginThrottle.recordFailure(cleanUsername);
      SecurityAuditLogger.record({
        actor: cleanUsername,
        action: 'LOGIN_FAILURE',
        resource: '/api/auth/login',
        result: 'FAILURE',
        ipAddress: metadata?.ipAddress,
        metadata: { reason: 'INVALID_PASSWORD', locked: failRecord.locked }
      });
      if (failRecord.locked) {
        return {
          success: false,
          message: `Account temporarily locked due to repeated failed login attempts. Try again in ${failRecord.retryAfterSeconds} seconds.`
        };
      }
      return {
        success: false,
        message: 'Invalid username or password.'
      };
    }

    // Login successful: reset failure throttle
    LoginThrottle.recordSuccess(cleanUsername);

    // Register active server-side session
    const session = SessionManager.createSession({
      userId: user.id || user.username,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    });

    const token = AuthService.createToken({
      sessionId: session.sessionId,
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    });

    SecurityAuditLogger.record({
      actor: user.username,
      action: 'LOGIN_SUCCESS',
      resource: '/api/auth/login',
      result: 'SUCCESS',
      ipAddress: metadata?.ipAddress,
      metadata: { role: user.role, sessionId: session.sessionId }
    });

    return {
      success: true,
      message: 'Authentication successful.',
      token,
      sessionId: session.sessionId,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    };
  }

  public async changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> {
    if (!userId || !currentPass || !newPass) {
      return { success: false, message: 'All password fields are required.' };
    }

    if (newPass.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters long.' };
    }

    let user = await this.userRepo.findById(userId);
    if (!user) {
      user = await this.userRepo.findByUsername(userId);
    }
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const isMatch = AuthService.verifyPassword(currentPass, user.passwordHash);
    if (!isMatch) {
      return { success: false, message: 'Current password does not match.' };
    }

    const newHash = AuthService.hashPassword(newPass);
    const updatedUser = user.withPasswordHash(newHash);
    await this.userRepo.saveUser(updatedUser);

    // Security-sensitive invalidation: Terminate all active sessions for this user!
    SessionManager.revokeAllUserSessions(user.id || user.username, 'PASSWORD_CHANGED');

    SecurityAuditLogger.record({
      actor: user.username,
      action: 'PASSWORD_CHANGED',
      resource: '/api/auth/change-password',
      result: 'SUCCESS'
    });

    return {
      success: true,
      message: 'Password changed successfully. All previous sessions have been invalidated.'
    };
  }

  public async listUsers(): Promise<Array<{ id?: string; username: string; fullName: string; role: UserRoleType; isActive: boolean; createdAt: string }>> {
    const users = await this.userRepo.listUsers();
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    }));
  }

  public async setUserActiveStatus(
    targetUsername: string,
    isActive: boolean,
    actorUsername: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanTarget = targetUsername.trim().toLowerCase();
    const user = await this.userRepo.findByUsername(cleanTarget);
    if (!user) {
      return { success: false, message: `User '${targetUsername}' not found.` };
    }

    // Guardrail: Cannot disable the last active administrator
    if (!isActive && user.isAdmin()) {
      const allUsers = await this.userRepo.listUsers();
      const activeAdmins = allUsers.filter((u) => u.isAdmin() && u.isActive && u.username !== cleanTarget);
      if (activeAdmins.length === 0) {
        return {
          success: false,
          message: 'Cannot disable the last active administrator account. The system requires at least one active administrator.'
        };
      }
    }

    const updated = user.withActiveStatus(isActive);
    await this.userRepo.saveUser(updated);

    // If disabled, revoke all active sessions immediately
    if (!isActive) {
      SessionManager.revokeAllUserSessions(user.id || user.username, 'ACCOUNT_DISABLED');
    }

    SecurityAuditLogger.record({
      actor: actorUsername,
      action: isActive ? 'USER_ENABLED' : 'USER_DISABLED',
      resource: `/api/users/${cleanTarget}/status`,
      result: 'SUCCESS',
      metadata: { targetUser: cleanTarget, isActive }
    });

    return {
      success: true,
      message: `User '${cleanTarget}' ${isActive ? 'enabled' : 'disabled'} successfully.`
    };
  }

  public async verifyToken(token: string): Promise<TokenPayload | null> {
    if (!token) return null;
    return AuthService.verifyToken(token);
  }
}
