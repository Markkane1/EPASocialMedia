import { Request, Response, NextFunction } from 'express';
import { AuthUseCase } from '../../../application/use-cases/AuthUseCase';

export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body;
      const result = await this.authUseCase.login(username, password);

      if (!result.success) {
        res.status(401).json({
          error: 'Unauthorized',
          message: result.message
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        message: result.message,
        token: result.token,
        user: result.user
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized', message: 'No active session.' });
        return;
      }

      res.status(200).json({
        status: 'success',
        user: {
          username: req.user.username,
          role: req.user.role,
          fullName: req.user.fullName
        }
      });
    } catch (err: any) {
      next(err);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.sessionId) {
        const { SessionManager } = await import('../../../infrastructure/auth/SessionManager');
        SessionManager.revokeSession(req.user.sessionId, 'USER_LOGOUT');
      }

      const { SecurityAuditLogger } = await import('../../../infrastructure/logging/SecurityAuditLogger');
      SecurityAuditLogger.record({
        actor: req.user?.username || 'ANONYMOUS',
        action: 'USER_LOGOUT',
        resource: '/api/auth/logout',
        result: 'SUCCESS',
        ipAddress: req.ip || req.socket.remoteAddress
      });

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully. Session invalidated.'
      });
    } catch (err: any) {
      next(err);
    }
  };

  public getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { SecurityAuditLogger } = await import('../../../infrastructure/logging/SecurityAuditLogger');
      const rawLimit = typeof req.query.limit === 'number' ? req.query.limit : parseInt(req.query.limit as string, 10);
      const limit = isNaN(rawLimit) ? 50 : Math.max(1, Math.min(100, rawLimit));
      const logs = await SecurityAuditLogger.getDurableLogs(limit);
      res.status(200).json({
        status: 'success',
        total: logs.length,
        logs
      });
    } catch (err: any) {
      next(err);
    }
  };

  public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized', message: 'No active session.' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const targetUserId = req.user.userId || req.user.username;
      const result = await this.authUseCase.changePassword(targetUserId, currentPassword, newPassword);

      if (!result.success) {
        res.status(400).json({
          error: 'BadRequest',
          message: result.message
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (err: any) {
      next(err);
    }
  };

  public listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.authUseCase.listUsers();
      res.status(200).json({ status: 'success', users });
    } catch (err: any) {
      next(err);
    }
  };

  public setUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUsername = req.params.username;
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        res.status(400).json({ error: 'BadRequest', message: 'Field "isActive" must be an explicit boolean.' });
        return;
      }
      const actorUsername = req.user?.username || 'SYSTEM';

      const result = await this.authUseCase.setUserActiveStatus(targetUsername, isActive, actorUsername);

      if (!result.success) {
        res.status(400).json({ error: 'BadRequest', message: result.message });
        return;
      }

      res.status(200).json({ status: 'success', message: result.message });
    } catch (err: any) {
      next(err);
    }
  };
}
