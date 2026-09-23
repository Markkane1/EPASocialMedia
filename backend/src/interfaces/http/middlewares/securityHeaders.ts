import { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';

/**
 * Phase 6: Web & Browser Security Hardening
 * - Standard HTTP Security Headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
 * - Strict Whitelist-based CORS
 * - Origin / Referer Validation against Cross-Site Request Forgery (CSRF)
 */

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking / frame embedding
  res.setHeader('X-Frame-Options', 'DENY');

  // Strict referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict sensitive browser APIs
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');

  // Cross-Origin isolation protections
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // Tailored Content Security Policy (L-09 Hardened: self-hosted fonts, no external CDN dependencies)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  // Enforce HSTS in production environments
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

/**
 * Allowed origins determination
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim().toLowerCase())
    : [];

  const port = process.env.PORT || '8080';
  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  return Array.from(new Set([...defaultOrigins, ...envOrigins]));
}

/**
 * Strict CORS Configuration
 */
export function createCorsMiddleware() {
  const allowed = getAllowedOrigins();

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin, Supertest)
      if (!origin) {
        return callback(null, true);
      }

      const normalized = origin.toLowerCase().trim();
      if (allowed.includes(normalized)) {
        return callback(null, true);
      }

      // Disallowed origin: omit access-control-allow-origin header
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
  };

  return cors(corsOptions);
}

/**
 * Defense-in-depth CSRF verification for state-changing requests
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];

  // If browser sent an Origin header, it must be verified against allowed origins
  if (origin && typeof origin === 'string') {
    const allowed = getAllowedOrigins();
    const normalized = origin.toLowerCase().trim();
    if (!allowed.includes(normalized)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Cross-origin state-changing request rejected by CSRF protection.'
      });
      return;
    }
  }

  // If no Origin but Referer is present, verify host
  if (!origin && referer && typeof referer === 'string') {
    try {
      const parsedUrl = new URL(referer);
      const refererOrigin = parsedUrl.origin.toLowerCase();
      const allowed = getAllowedOrigins();
      if (!allowed.includes(refererOrigin)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Cross-origin state-changing request rejected by CSRF protection.'
        });
        return;
      }
    } catch {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Malformed Referer header rejected.'
      });
      return;
    }
  }

  next();
}

/**
 * Prevents client/proxy caching of sensitive API data (M-04)
 */
export function apiNoCache(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}
