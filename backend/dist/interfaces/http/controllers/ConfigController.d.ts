import { Request, Response, NextFunction } from 'express';
import { ConfigUseCase } from '../../../application/use-cases/ConfigUseCase';
import { TestConnectionUseCase } from '../../../application/use-cases/TestConnectionUseCase';
export declare class ConfigController {
    private readonly configUseCase;
    private readonly testConnectionUseCase;
    constructor(configUseCase: ConfigUseCase, testConnectionUseCase: TestConnectionUseCase);
    getConfig(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateConfig(req: Request, res: Response, next: NextFunction): Promise<void>;
    testConnection(req: Request, res: Response, next: NextFunction): Promise<void>;
}
