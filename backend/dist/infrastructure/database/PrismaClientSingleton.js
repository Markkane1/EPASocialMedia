"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClientSingleton = void 0;
const client_1 = require("@prisma/client");
class PrismaClientSingleton {
    static instance = null;
    static isConnected = null;
    static lastCheckTime = 0;
    static RECHECK_BACKOFF_MS = 15000;
    static getInstance() {
        if (!PrismaClientSingleton.instance) {
            PrismaClientSingleton.instance = new client_1.PrismaClient({
                log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
            });
        }
        return PrismaClientSingleton.instance;
    }
    static async checkConnection() {
        const now = Date.now();
        // If previously failed, do not immediately recheck if within backoff window
        if (PrismaClientSingleton.isConnected === false &&
            now - PrismaClientSingleton.lastCheckTime < PrismaClientSingleton.RECHECK_BACKOFF_MS) {
            return false;
        }
        if (PrismaClientSingleton.isConnected === true) {
            return true;
        }
        PrismaClientSingleton.lastCheckTime = now;
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
    static async forceReconnect() {
        PrismaClientSingleton.isConnected = null;
        PrismaClientSingleton.lastCheckTime = 0;
        return await PrismaClientSingleton.checkConnection();
    }
    static reset() {
        PrismaClientSingleton.isConnected = null;
        PrismaClientSingleton.lastCheckTime = 0;
        PrismaClientSingleton.instance = null;
    }
}
exports.PrismaClientSingleton = PrismaClientSingleton;
