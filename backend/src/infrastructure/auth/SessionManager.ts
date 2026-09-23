import * as crypto from 'crypto';
import { UserRoleType } from '../../domain/entities/User';

export interface UserSession {
  sessionId: string;
  userId: string;
  username: string;
  role: UserRoleType;
  fullName: string;
  createdAt: number;
  lastActivityAt: number;
  isRevoked: boolean;
  revokedReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: UserSession;
  error?: 'SESSION_NOT_FOUND' | 'SESSION_REVOKED' | 'SESSION_EXPIRED_IDLE' | 'SESSION_EXPIRED_ABSOLUTE';
  message?: string;
}

export class SessionManager {
  private static sessions: Map<string, UserSession> = new Map();

  // Configurable timeouts with sensible security defaults:
  // Default idle timeout: 30 minutes
  // Default absolute lifetime: 8 hours
  public static getIdleTimeoutMs(): number {
    const minutes = parseInt(process.env.SESSION_IDLE_TIMEOUT_MINUTES || '30', 10);
    return (isNaN(minutes) ? 30 : minutes) * 60 * 1000;
  }

  public static getAbsoluteLifetimeMs(): number {
    const hours = parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT_HOURS || '8', 10);
    return (isNaN(hours) ? 8 : hours) * 60 * 60 * 1000;
  }

  public static createSession(params: {
    userId: string;
    username: string;
    role: UserRoleType;
    fullName: string;
    ipAddress?: string;
    userAgent?: string;
  }): UserSession {
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    const session: UserSession = {
      sessionId,
      userId: params.userId,
      username: params.username,
      role: params.role,
      fullName: params.fullName,
      createdAt: now,
      lastActivityAt: now,
      isRevoked: false,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  public static validateSession(sessionId: string): SessionValidationResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        valid: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Session does not exist or has been invalidated.'
      };
    }

    if (session.isRevoked) {
      return {
        valid: false,
        error: 'SESSION_REVOKED',
        message: `Session has been revoked (${session.revokedReason || 'Logged out'}). Please sign in again.`
      };
    }

    const now = Date.now();

    // 1. Enforce Absolute Session Lifetime
    if (now - session.createdAt > this.getAbsoluteLifetimeMs()) {
      session.isRevoked = true;
      session.revokedReason = 'ABSOLUTE_LIFETIME_EXCEEDED';
      return {
        valid: false,
        error: 'SESSION_EXPIRED_ABSOLUTE',
        message: 'Session has reached its maximum absolute lifetime. Please sign in again.'
      };
    }

    // 2. Enforce Idle Timeout
    if (now - session.lastActivityAt > this.getIdleTimeoutMs()) {
      session.isRevoked = true;
      session.revokedReason = 'IDLE_TIMEOUT_EXCEEDED';
      return {
        valid: false,
        error: 'SESSION_EXPIRED_IDLE',
        message: 'Session expired due to inactivity. Please sign in again.'
      };
    }

    // 3. Sliding Activity Update
    session.lastActivityAt = now;
    return {
      valid: true,
      session
    };
  }

  public static revokeSession(sessionId: string, reason: string = 'USER_LOGOUT'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.isRevoked = true;
    session.revokedReason = reason;
    return true;
  }

  public static revokeAllUserSessions(userId: string, reason: string = 'SECURITY_SENSITIVE_CHANGE'): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.isRevoked) {
        session.isRevoked = true;
        session.revokedReason = reason;
        count++;
      }
    }
    return count;
  }

}
