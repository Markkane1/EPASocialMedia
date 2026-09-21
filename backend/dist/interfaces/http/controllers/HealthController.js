"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const PrismaClientSingleton_1 = require("../../../infrastructure/database/PrismaClientSingleton");
class HealthController {
    async getStatus(req, res) {
        const dbConnected = await PrismaClientSingleton_1.PrismaClientSingleton.checkConnection();
        res.status(200).json({
            status: 'healthy',
            service: 'EPA Punjab Social Dashboard',
            version: '2.0.0 (Clean Architecture)',
            database: {
                engine: 'PostgreSQL',
                connected: dbConnected,
                orm: 'Prisma'
            },
            timestamp: new Date().toISOString()
        });
    }
}
exports.HealthController = HealthController;
//# sourceMappingURL=HealthController.js.map