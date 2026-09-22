import { UserRoleType } from '../../domain/entities/User';
export interface TokenPayload {
    sessionId?: string;
    userId?: string;
    username: string;
    role: UserRoleType;
    fullName: string;
    iat?: number;
    exp: number;
}
export declare class AuthService {
    private static getSecret;
    static hashPassword(password: string): string;
    static verifyPassword(password: string, storedHash: string): boolean;
    static createToken(payload: Omit<TokenPayload, 'exp'>, expiresInHours?: number): string;
    static verifyToken(token: string): TokenPayload | null;
}
