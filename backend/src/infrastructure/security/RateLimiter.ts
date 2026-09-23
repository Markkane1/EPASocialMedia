import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export class RateLimiter {
  private static store: Map<string, RateLimitRecord> = new Map();

  private static sweepExpired(): void {
    const now = Date.now();
    for (const [key, record] of RateLimiter.store.entries()) {
      if (now > record.resetTime) {
        RateLimiter.store.delete(key);
      }
    }
  }

  public static create(options: RateLimitOptions) {
    const {
      windowMs,
      max,
      message = 'Too many requests. Rate limit exceeded.',
      keyGenerator = (req: Request) => {
        const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
        const user = (req as any).user?.username || '';
        return `${req.baseUrl || ''}${req.path}:${ip}:${user}`;
      }
    } = options;

    return (req: Request, res: Response, next: NextFunction): void => {
      if (RateLimiter.store.size > 500) {
        RateLimiter.sweepExpired();
      }

      const key = keyGenerator(req);
      const now = Date.now();
      let record = RateLimiter.store.get(key);

      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + windowMs };
        RateLimiter.store.set(key, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, max - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetSeconds);

      if (record.count > max) {
        res.setHeader('Retry-After', resetSeconds);
        res.status(429).json({
          error: 'TooManyRequests',
          message: `${message} Please try again in ${resetSeconds} seconds.`,
          retryAfterSeconds: resetSeconds
        });
        return;
      }

      next();
    };
  }

  public static clearAll(): void {
    this.store.clear();
  }
}
