import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AuthService, TokenPayload } from '../../infrastructure/auth/AuthService';
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

export class AuthUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  public async login(username: string, password: string): Promise<LoginResult> {
    if (!username || !password) {
      return {
        success: false,
        message: 'Username and password are required.'
      };
    }

    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      return {
        success: false,
        message: 'Invalid username or password.'
      };
    }

    const isValid = AuthService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid username or password.'
      };
    }

    const token = AuthService.createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    });

    return {
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    };
  }

  public async verifyToken(token: string): Promise<TokenPayload | null> {
    if (!token) return null;
    return AuthService.verifyToken(token);
  }
}
