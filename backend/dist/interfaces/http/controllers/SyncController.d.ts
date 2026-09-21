import { Request, Response, NextFunction } from 'express';
import { SyncPlatformsUseCase } from '../../../application/use-cases/SyncPlatformsUseCase';
export declare class SyncController {
    private readonly syncUseCase;
    constructor(syncUseCase: SyncPlatformsUseCase);
    syncAll(req: Request, res: Response, next: NextFunction): Promise<void>;
}
