import * as crypto from 'crypto';
import { UserRoleType } from '../../domain/entities/User';

export interface TokenPayload {
  userId?: string;
  username: string;
  role: UserRoleType;
  fullName: string;
  exp: number; // UNIX timestamp in ms
}

export class AuthService {
  private static readonly SECRET = process.env.JWT_SECRET || 'EPA_PUNJAB_SECURE_AUTH_SECRET_2026_KEY_#$';

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

  public static createToken(payload: Omit<TokenPayload, 'exp'>, expiresInHours: number = 24): string {
    const fullPayload: TokenPayload = {
      ...payload,
      exp: Date.now() + expiresInHours * 3600 * 1000
    };

    const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.SECRET)
      .update(payloadB64)
      .digest('base64url');

    return `${payloadB64}.${signature}`;
  }

  public static verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;

      const [payloadB64, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET)
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
