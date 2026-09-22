"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
const AuthService_1 = require("../../../infrastructure/auth/AuthService");
const SessionManager_1 = require("../../../infrastructure/auth/SessionManager");
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    if (!token) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required. Please provide a valid Bearer token.'
        });
        return;
    }
    const payload = AuthService_1.AuthService.verifyToken(token);
    if (!payload) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired session token.'
        });
        return;
    }
    // Server-side session lifecycle & timeout validation
    if (payload.sessionId) {
        const sessionValidation = SessionManager_1.SessionManager.validateSession(payload.sessionId);
        if (!sessionValidation.valid) {
            res.status(401).json({
                error: 'Unauthorized',
                code: sessionValidation.error,
                message: sessionValidation.message || 'Session has expired or been invalidated.'
            });
            return;
        }
    }
    req.user = payload;
    next();
}
exports.requireAuth = authenticateToken;
function requireRole(requiredRole) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required.'
            });
            return;
        }
        if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
            res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. Requires '${requiredRole}' role.`
            });
            return;
        }
        next();
    };
}
function requirePermission(requiredPermission) {
    const { hasPermission } = require('../../../infrastructure/auth/Permissions');
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required.'
            });
            return;
        }
        if (!hasPermission(req.user.role, requiredPermission)) {
            res.status(403).json({
                error: 'Forbidden',
                code: 'INSUFFICIENT_PERMISSIONS',
                message: `Access denied. Requires '${requiredPermission}' permission.`
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=authGuard.js.map