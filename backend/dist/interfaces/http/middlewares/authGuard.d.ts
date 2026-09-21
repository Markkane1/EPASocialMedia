import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../../../infrastructure/auth/AuthService';
import { UserRoleType } from '../../../domain/entities/User';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): void;
export declare function requireRole(requiredRole: UserRoleType): (req: Request, res: Response, next: NextFunction) => void;
