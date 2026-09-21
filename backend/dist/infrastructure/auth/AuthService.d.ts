import { UserRoleType } from '../../domain/entities/User';
export interface TokenPayload {
    userId?: string;
    username: string;
    role: UserRoleType;
    fullName: string;
    exp: number;
}
export declare class AuthService {
    private static readonly SECRET;
    static hashPassword(password: string): string;
    static verifyPassword(password: string, storedHash: string): boolean;
    static createToken(payload: Omit<TokenPayload, 'exp'>, expiresInHours?: number): string;
    static verifyToken(token: string): TokenPayload | null;
}
