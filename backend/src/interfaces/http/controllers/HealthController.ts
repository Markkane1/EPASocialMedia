import { Request, Response } from 'express';
import { PrismaClientSingleton } from '../../../infrastructure/database/PrismaClientSingleton';

export class HealthController {
  public async getStatus(req: Request, res: Response): Promise<void> {
    const dbConnected = await PrismaClientSingleton.checkConnection();

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
