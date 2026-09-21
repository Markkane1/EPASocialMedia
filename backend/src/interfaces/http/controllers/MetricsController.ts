import { Request, Response, NextFunction } from 'express';
import { GetMetricsUseCase } from '../../../application/use-cases/GetMetricsUseCase';

export class MetricsController {
  constructor(private readonly getMetricsUseCase: GetMetricsUseCase) {}

  public async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = req.query.period as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const result = await this.getMetricsUseCase.execute({ period, from, to });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
