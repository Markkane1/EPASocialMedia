import { Request, Response, NextFunction } from 'express';
import { SyncPlatformsUseCase } from '../../../application/use-cases/SyncPlatformsUseCase';

export class SyncController {
  constructor(private readonly syncUseCase: SyncPlatformsUseCase) {}

  public async syncAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.syncUseCase.execute();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
