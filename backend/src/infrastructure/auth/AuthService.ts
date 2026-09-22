import * as crypto from 'crypto';
import { UserRoleType } from '../../domain/entities/User';

export interface TokenPayload {
  sessionId?: string;
  userId?: string;
  username: string;
  role: UserRoleType;
  fullName: string;
  iat?: number;
  exp: number; // UNIX timestamp in ms
}

export class AuthService {
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production') {
      if (!secret || secret.length < 32 || secret.includes('EPA_PUNJAB_SECURE_AUTH_SECRET_2026')) {
        throw new Error(
          '[FATAL SECURITY CONFIG ERROR] In production, JWT_SECRET must be set as an environment variable with at least 32 characters. Refusing to run with default secret.'
        );
      }
      return secret;
    }
    return secret || 'EPA_PUNJAB_SECURE_DEV_AUTH_SECRET_2026_KEY_#$';
  }

  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  public static verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'));
  }

  public static createToken(payload: Omit<TokenPayload, 'exp'>, expiresInHours: number = 8): string {
    const now = Date.now();
    const fullPayload: TokenPayload = {
      ...payload,
      iat: payload.iat || now,
      exp: now + expiresInHours * 3600 * 1000
    };

    const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const secret = this.getSecret();
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    return `${payloadB64}.${signature}`;
  }

  public static verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;

      const [payloadB64, signature] = parts;
      const secret = this.getSecret();
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadB64)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }

      const payload: TokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (Date.now() > payload.exp) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }
}
