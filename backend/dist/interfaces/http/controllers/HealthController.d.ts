import { Request, Response } from 'express';
export declare class HealthController {
    getStatus(req: Request, res: Response): Promise<void>;
}
