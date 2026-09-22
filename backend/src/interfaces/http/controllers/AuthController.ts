import { Request, Response } from 'express';
import { AuthUseCase } from '../../../application/use-cases/AuthUseCase';

export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  public login = async (req: Request, res: Response): Promise<void> => {
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
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message
      });
    }
  };

  public getMe = async (req: Request, res: Response): Promise<void> => {
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
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
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
  };

  public getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    const { SecurityAuditLogger } = await import('../../../infrastructure/logging/SecurityAuditLogger');
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = SecurityAuditLogger.getRecentLogs(limit);
    res.status(200).json({
      status: 'success',
      total: logs.length,
      logs
    });
  };

  public changePassword = async (req: Request, res: Response): Promise<void> => {
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
      res.status(500).json({
        error: 'InternalServerError',
        message: err.message
      });
    }
  };

  public listUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.authUseCase.listUsers();
      res.status(200).json({ status: 'success', users });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  };

  public setUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUsername = req.params.username;
      const { isActive } = req.body;
      const actorUsername = req.user?.username || 'SYSTEM';

      const result = await this.authUseCase.setUserActiveStatus(targetUsername, Boolean(isActive), actorUsername);

      if (!result.success) {
        res.status(400).json({ error: 'BadRequest', message: result.message });
        return;
      }

      res.status(200).json({ status: 'success', message: result.message });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  };
}
