import { PrismaClient } from '@prisma/client';
export declare class PrismaClientSingleton {
    private static instance;
    private static isConnected;
    private static lastCheckTime;
    private static readonly RECHECK_BACKOFF_MS;
    static getInstance(): PrismaClient;
    static checkConnection(): Promise<boolean>;
    static forceReconnect(): Promise<boolean>;
    static reset(): void;
}
