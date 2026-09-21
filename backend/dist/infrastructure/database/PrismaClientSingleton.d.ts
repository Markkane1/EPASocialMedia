import { PrismaClient } from '@prisma/client';
export declare class PrismaClientSingleton {
    private static instance;
    private static isConnected;
    static getInstance(): PrismaClient;
    static checkConnection(): Promise<boolean>;
}
