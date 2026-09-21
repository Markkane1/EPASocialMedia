import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../../../infrastructure/auth/AuthService';
import { UserRoleType } from '../../../domain/entities/User';

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

  req.user = payload;
  next();
}

export function requireRole(requiredRole: UserRoleType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.'
      });
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires '${requiredRole}' role.`
      });
      return;
    }

    next();
  };
}
