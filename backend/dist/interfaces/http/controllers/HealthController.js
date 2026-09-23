"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const PrismaClientSingleton_1 = require("../../../infrastructure/database/PrismaClientSingleton");
class HealthController {
    /**
     * Liveness probe: proves Node.js event loop is operational without disclosing implementation details (M-05).
     */
    getLiveness = (req, res) => {
        res.status(200).json({ status: 'UP' });
    };
    /**
     * Readiness probe: checks backend connectivity without exposing engine/ORM details (M-05).
     */
    getReadiness = async (req, res) => {
        const isReady = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        if (isReady) {
            res.status(200).json({ status: 'READY' });
        }
        else {
            res.status(503).json({ status: 'NOT_READY' });
        }
    };
    /**
     * Public health check for /api/status returning healthy status with sanitized database connection flag
     */
    getPublicStatus = async (req, res) => {
        const dbConnected = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        res.status(200).json({
            status: 'healthy',
            service: 'EPA Punjab Social Media Intelligence API',
            database: {
                connected: dbConnected
            },
            timestamp: new Date().toISOString()
        });
    };
    /**
     * Health status: returns sanitized status for public callers, or diagnostics for admins (M-05).
     */
    getStatus = async (req, res) => {
        const dbConnected = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        // Redact internal implementation details from unauthenticated public callers (M-05)
        if (req.user?.role === 'ADMIN') {
            res.status(200).json({
                status: dbConnected ? 'healthy' : 'degraded',
                database: {
                    connected: dbConnected,
                    engine: 'PostgreSQL',
                    orm: 'Prisma'
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.status(200).json({
            status: 'UP',
            timestamp: new Date().toISOString()
        });
    };
}
exports.HealthController = HealthController;
