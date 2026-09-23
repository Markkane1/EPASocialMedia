import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../../../infrastructure/auth/AuthService';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): void;
export declare const requireAuth: typeof authenticateToken;
export declare function requirePermission(requiredPermission: import('../../../infrastructure/auth/Permissions').Permission): (req: Request, res: Response, next: NextFunction) => void;
