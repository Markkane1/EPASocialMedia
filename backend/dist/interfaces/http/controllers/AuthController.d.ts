import { Request, Response, NextFunction } from 'express';
import { AuthUseCase } from '../../../application/use-cases/AuthUseCase';
export declare class AuthController {
    private readonly authUseCase;
    constructor(authUseCase: AuthUseCase);
    login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMe: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAuditLogs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    changePassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    setUserStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
