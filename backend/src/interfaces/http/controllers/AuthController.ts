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
}
