"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const AuthService_1 = require("../../../infrastructure/auth/AuthService");
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
    req.user = payload;
    next();
}
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
//# sourceMappingURL=authGuard.js.map