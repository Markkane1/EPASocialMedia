import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { TokenPayload } from '../../infrastructure/auth/AuthService';
import { UserRoleType } from '../../domain/entities/User';
export interface LoginResult {
    success: boolean;
    message: string;
    token?: string;
    sessionId?: string;
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
    login(username: string, password: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<LoginResult>;
    changePassword(userId: string, currentPass: string, newPass: string): Promise<{
        success: boolean;
        message: string;
    }>;
    listUsers(): Promise<Array<{
        id?: string;
        username: string;
        fullName: string;
        role: UserRoleType;
        isActive: boolean;
        createdAt: string;
    }>>;
    setUserActiveStatus(targetUsername: string, isActive: boolean, actorUsername: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyToken(token: string): Promise<TokenPayload | null>;
}
