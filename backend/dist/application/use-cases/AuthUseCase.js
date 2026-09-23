"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCase = void 0;
const AuthService_1 = require("../../infrastructure/auth/AuthService");
const SessionManager_1 = require("../../infrastructure/auth/SessionManager");
const LoginThrottle_1 = require("../../infrastructure/auth/LoginThrottle");
const SecurityAuditLogger_1 = require("../../infrastructure/logging/SecurityAuditLogger");
class AuthUseCase {
    userRepo;
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async login(username, password, metadata) {
        if (!username || !password) {
            return {
                success: false,
                message: 'Username and password are required.'
            };
        }
        const cleanUsername = username.trim().toLowerCase();
        // 1. Check Brute-Force Rate Limiting / Lockout
        const lockCheck = LoginThrottle_1.LoginThrottle.isLocked(cleanUsername);
        if (lockCheck.locked) {
            SecurityAuditLogger_1.SecurityAuditLogger.record({
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
            LoginThrottle_1.LoginThrottle.recordFailure(cleanUsername);
            SecurityAuditLogger_1.SecurityAuditLogger.record({
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
            SecurityAuditLogger_1.SecurityAuditLogger.record({
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
        const isValid = AuthService_1.AuthService.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            const failRecord = LoginThrottle_1.LoginThrottle.recordFailure(cleanUsername);
            SecurityAuditLogger_1.SecurityAuditLogger.record({
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
        LoginThrottle_1.LoginThrottle.recordSuccess(cleanUsername);
        // Register active server-side session
        const session = SessionManager_1.SessionManager.createSession({
            userId: user.id || user.username,
            username: user.username,
            role: user.role,
            fullName: user.fullName,
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent
        });
        const token = AuthService_1.AuthService.createToken({
            sessionId: session.sessionId,
            userId: user.id,
            username: user.username,
            role: user.role,
            fullName: user.fullName
        });
        SecurityAuditLogger_1.SecurityAuditLogger.record({
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
    async changePassword(userId, currentPass, newPass) {
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
        const isMatch = AuthService_1.AuthService.verifyPassword(currentPass, user.passwordHash);
        if (!isMatch) {
            return { success: false, message: 'Current password does not match.' };
        }
        const newHash = AuthService_1.AuthService.hashPassword(newPass);
        const updatedUser = user.withPasswordHash(newHash);
        await this.userRepo.saveUser(updatedUser);
        // Security-sensitive invalidation: Terminate all active sessions for this user!
        SessionManager_1.SessionManager.revokeAllUserSessions(user.id || user.username, 'PASSWORD_CHANGED');
        SecurityAuditLogger_1.SecurityAuditLogger.record({
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
    async listUsers() {
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
    async setUserActiveStatus(targetUsername, isActive, actorUsername) {
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
            SessionManager_1.SessionManager.revokeAllUserSessions(user.id || user.username, 'ACCOUNT_DISABLED');
        }
        SecurityAuditLogger_1.SecurityAuditLogger.record({
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
    async verifyToken(token) {
        if (!token)
            return null;
        return AuthService_1.AuthService.verifyToken(token);
    }
}
exports.AuthUseCase = AuthUseCase;
