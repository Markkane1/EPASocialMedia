import { Request, Response } from 'express';
import { AuthUseCase } from '../../../application/use-cases/AuthUseCase';
export declare class AuthController {
    private readonly authUseCase;
    constructor(authUseCase: AuthUseCase);
    login: (req: Request, res: Response) => Promise<void>;
    getMe: (req: Request, res: Response) => Promise<void>;
    logout: (req: Request, res: Response) => Promise<void>;
    getAuditLogs: (req: Request, res: Response) => Promise<void>;
    changePassword: (req: Request, res: Response) => Promise<void>;
    listUsers: (req: Request, res: Response) => Promise<void>;
    setUserStatus: (req: Request, res: Response) => Promise<void>;
}
