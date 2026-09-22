"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    authUseCase;
    constructor(authUseCase) {
        this.authUseCase = authUseCase;
    }
    login = async (req, res) => {
        try {
            const { username, password } = req.body;
            const result = await this.authUseCase.login(username, password);
            if (!result.success) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: result.message
                });
                return;
            }
            res.status(200).json({
                status: 'success',
                message: result.message,
                token: result.token,
                user: result.user
            });
        }
        catch (err) {
            res.status(500).json({
                error: 'InternalServerError',
                message: err.message
            });
        }
    };
    getMe = async (req, res) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized', message: 'No active session.' });
            return;
        }
        res.status(200).json({
            status: 'success',
            user: {
                username: req.user.username,
                role: req.user.role,
                fullName: req.user.fullName
            }
        });
    };
    logout = async (req, res) => {
        if (req.user?.sessionId) {
            const { SessionManager } = await Promise.resolve().then(() => __importStar(require('../../../infrastructure/auth/SessionManager')));
            SessionManager.revokeSession(req.user.sessionId, 'USER_LOGOUT');
        }
        const { SecurityAuditLogger } = await Promise.resolve().then(() => __importStar(require('../../../infrastructure/logging/SecurityAuditLogger')));
        SecurityAuditLogger.record({
            actor: req.user?.username || 'ANONYMOUS',
            action: 'USER_LOGOUT',
            resource: '/api/auth/logout',
            result: 'SUCCESS',
            ipAddress: req.ip || req.socket.remoteAddress
        });
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully. Session invalidated.'
        });
    };
    getAuditLogs = async (req, res) => {
        const { SecurityAuditLogger } = await Promise.resolve().then(() => __importStar(require('../../../infrastructure/logging/SecurityAuditLogger')));
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const logs = SecurityAuditLogger.getRecentLogs(limit);
        res.status(200).json({
            status: 'success',
            total: logs.length,
            logs
        });
    };
    changePassword = async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized', message: 'No active session.' });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            const targetUserId = req.user.userId || req.user.username;
            const result = await this.authUseCase.changePassword(targetUserId, currentPassword, newPassword);
            if (!result.success) {
                res.status(400).json({
                    error: 'BadRequest',
                    message: result.message
                });
                return;
            }
            res.status(200).json({
                status: 'success',
                message: result.message
            });
        }
        catch (err) {
            res.status(500).json({
                error: 'InternalServerError',
                message: err.message
            });
        }
    };
    listUsers = async (req, res) => {
        try {
            const users = await this.authUseCase.listUsers();
            res.status(200).json({ status: 'success', users });
        }
        catch (err) {
            res.status(500).json({ error: 'InternalServerError', message: err.message });
        }
    };
    setUserStatus = async (req, res) => {
        try {
            const targetUsername = req.params.username;
            const { isActive } = req.body;
            const actorUsername = req.user?.username || 'SYSTEM';
            const result = await this.authUseCase.setUserActiveStatus(targetUsername, Boolean(isActive), actorUsername);
            if (!result.success) {
                res.status(400).json({ error: 'BadRequest', message: result.message });
                return;
            }
            res.status(200).json({ status: 'success', message: result.message });
        }
        catch (err) {
            res.status(500).json({ error: 'InternalServerError', message: err.message });
        }
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map