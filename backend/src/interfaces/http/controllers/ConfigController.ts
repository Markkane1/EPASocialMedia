import { Request, Response, NextFunction } from 'express';
import { ConfigUseCase } from '../../../application/use-cases/ConfigUseCase';
import { TestConnectionUseCase } from '../../../application/use-cases/TestConnectionUseCase';

export class ConfigController {
  constructor(
    private readonly configUseCase: ConfigUseCase,
    private readonly testConnectionUseCase: TestConnectionUseCase
  ) {}

  public async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await this.configUseCase.getMaskedConfig();
      res.status(200).json(config);
    } catch (err) {
      next(err);
    }
  }

  public async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updates = req.body || {};
      const result = await this.configUseCase.updateConfig(updates);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const platform = req.body?.platform || 'general';
      const result = await this.testConnectionUseCase.execute(platform);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
