import { Request, Response } from 'express';
export declare class HealthController {
    /**
     * Liveness probe: proves Node.js event loop is operational without disclosing implementation details (M-05).
     */
    getLiveness: (req: Request, res: Response) => void;
    /**
     * Readiness probe: checks backend connectivity without exposing engine/ORM details (M-05).
     */
    getReadiness: (req: Request, res: Response) => Promise<void>;
    /**
     * Public health check for /api/status returning healthy status with sanitized database connection flag
     */
    getPublicStatus: (req: Request, res: Response) => Promise<void>;
    /**
     * Health status: returns sanitized status for public callers, or diagnostics for admins (M-05).
     */
    getStatus: (req: Request, res: Response) => Promise<void>;
}
