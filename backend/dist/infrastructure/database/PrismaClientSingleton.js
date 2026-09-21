"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClientSingleton = void 0;
const client_1 = require("@prisma/client");
class PrismaClientSingleton {
    static instance = null;
    static isConnected = null;
    static getInstance() {
        if (!PrismaClientSingleton.instance) {
            PrismaClientSingleton.instance = new client_1.PrismaClient({
                log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
            });
        }
        return PrismaClientSingleton.instance;
    }
    static async checkConnection() {
        if (PrismaClientSingleton.isConnected !== null) {
            return PrismaClientSingleton.isConnected;
        }
        try {
            const client = PrismaClientSingleton.getInstance();
            await client.$queryRaw `SELECT 1`;
            PrismaClientSingleton.isConnected = true;
            console.log('[DATABASE] Successfully connected to PostgreSQL via Prisma.');
            return true;
        }
        catch (err) {
            PrismaClientSingleton.isConnected = false;
            console.warn(`[DATABASE] PostgreSQL not reachable at DATABASE_URL: ${err.message}. Using resilient fallback repository.`);
            return false;
        }
    }
}
exports.PrismaClientSingleton = PrismaClientSingleton;
//# sourceMappingURL=PrismaClientSingleton.js.map