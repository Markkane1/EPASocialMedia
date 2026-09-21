import { PrismaClient } from '@prisma/client';

export class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;
  private static isConnected: boolean | null = null;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
      });
    }
    return PrismaClientSingleton.instance;
  }

  public static async checkConnection(): Promise<boolean> {
    if (PrismaClientSingleton.isConnected !== null) {
      return PrismaClientSingleton.isConnected;
    }

    try {
      const client = PrismaClientSingleton.getInstance();
      await client.$queryRaw`SELECT 1`;
      PrismaClientSingleton.isConnected = true;
      console.log('[DATABASE] Successfully connected to PostgreSQL via Prisma.');
      return true;
    } catch (err: any) {
      PrismaClientSingleton.isConnected = false;
      console.warn(`[DATABASE] PostgreSQL not reachable at DATABASE_URL: ${err.message}. Using resilient fallback repository.`);
      return false;
    }
  }
}
