import { Request, Response, NextFunction } from 'express';
import { GetMetricsUseCase } from '../../../application/use-cases/GetMetricsUseCase';
export declare class MetricsController {
    private readonly getMetricsUseCase;
    constructor(getMetricsUseCase: GetMetricsUseCase);
    getMetrics(req: Request, res: Response, next: NextFunction): Promise<void>;
}
