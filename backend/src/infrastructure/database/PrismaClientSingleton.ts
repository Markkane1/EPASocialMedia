import { PrismaClient } from '@prisma/client';

export class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;
  private static isConnected: boolean | null = null;
  private static lastCheckTime: number = 0;
  private static readonly RECHECK_BACKOFF_MS: number = 15000;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
      });
    }
    return PrismaClientSingleton.instance;
  }

  public static async checkConnection(): Promise<boolean> {
    const now = Date.now();
    // If previously failed, do not immediately recheck if within backoff window
    if (
      PrismaClientSingleton.isConnected === false &&
      now - PrismaClientSingleton.lastCheckTime < PrismaClientSingleton.RECHECK_BACKOFF_MS
    ) {
      return false;
    }

    if (PrismaClientSingleton.isConnected === true) {
      return true;
    }

    PrismaClientSingleton.lastCheckTime = now;
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

  public static async forceReconnect(): Promise<boolean> {
    PrismaClientSingleton.isConnected = null;
    PrismaClientSingleton.lastCheckTime = 0;
    return await PrismaClientSingleton.checkConnection();
  }

  public static reset(): void {
    PrismaClientSingleton.isConnected = null;
    PrismaClientSingleton.lastCheckTime = 0;
    PrismaClientSingleton.instance = null;
  }
}
