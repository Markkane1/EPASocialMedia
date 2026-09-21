import { Request, Response } from 'express';
import { AuthUseCase } from '../../../application/use-cases/AuthUseCase';
export declare class AuthController {
    private readonly authUseCase;
    constructor(authUseCase: AuthUseCase);
    login: (req: Request, res: Response) => Promise<void>;
    getMe: (req: Request, res: Response) => Promise<void>;
}
