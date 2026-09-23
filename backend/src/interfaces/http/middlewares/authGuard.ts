import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../../../infrastructure/auth/AuthService';
import { SessionManager } from '../../../infrastructure/auth/SessionManager';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please provide a valid Bearer token.'
    });
    return;
  }

  const payload = AuthService.verifyToken(token);
  if (!payload) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired session token.'
    });
    return;
  }

  // Server-side session lifecycle & timeout validation
  if (payload.sessionId) {
    const sessionValidation = SessionManager.validateSession(payload.sessionId);
    if (!sessionValidation.valid) {
      res.status(401).json({
        error: 'Unauthorized',
        code: sessionValidation.error,
        message: sessionValidation.message || 'Session has expired or been invalidated.'
      });
      return;
    }
  }

  req.user = payload;
  next();
}

export const requireAuth = authenticateToken;

export function requirePermission(requiredPermission: import('../../../infrastructure/auth/Permissions').Permission) {
  const { hasPermission } = require('../../../infrastructure/auth/Permissions');
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.'
      });
      return;
    }

    if (!hasPermission(req.user.role, requiredPermission)) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Requires '${requiredPermission}' permission.`
      });
      return;
    }

    next();
  };
}
