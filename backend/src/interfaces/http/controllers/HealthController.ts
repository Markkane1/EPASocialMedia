import { Request, Response } from 'express';
import { PrismaClientSingleton } from '../../../infrastructure/database/PrismaClientSingleton';

export class HealthController {
  /**
   * Liveness probe: proves Node.js event loop is operational without disclosing implementation details (M-05).
   */
  public getLiveness = (req: Request, res: Response): void => {
    res.status(200).json({ status: 'UP' });
  };

  /**
   * Readiness probe: checks backend connectivity without exposing engine/ORM details (M-05).
   */
  public getReadiness = async (req: Request, res: Response): Promise<void> => {
    const isReady = await PrismaClientSingleton.checkConnection();
    if (isReady) {
      res.status(200).json({ status: 'READY' });
    } else {
      res.status(503).json({ status: 'NOT_READY' });
    }
  };

  /**
   * Health status: returns sanitized status for public callers, or diagnostics for admins (M-05).
   */
  public getStatus = async (req: Request, res: Response): Promise<void> => {
    const dbConnected = await PrismaClientSingleton.checkConnection();

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

