import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { TokenPayload } from '../../infrastructure/auth/AuthService';
import { UserRoleType } from '../../domain/entities/User';
export interface LoginResult {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        id?: string;
        username: string;
        fullName: string;
        role: UserRoleType;
    };
}
export declare class AuthUseCase {
    private readonly userRepo;
    constructor(userRepo: IUserRepository);
    login(username: string, password: string): Promise<LoginResult>;
    verifyToken(token: string): Promise<TokenPayload | null>;
}
