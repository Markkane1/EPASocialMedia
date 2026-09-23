import { AuthController } from '../../src/interfaces/http/controllers/AuthController';
import { UserStatusSchema, AuditLogQuerySchema } from '../../src/interfaces/http/validation/schemas';

describe('Controller Error Leakage & Validation Hardening (Item 10)', () => {
  describe('Zod Schemas', () => {
    it('UserStatusSchema accepts valid boolean isActive', () => {
      const valid = UserStatusSchema.safeParse({ isActive: true });
      expect(valid.success).toBe(true);

      const validFalse = UserStatusSchema.safeParse({ isActive: false });
      expect(validFalse.success).toBe(true);
    });

    it('UserStatusSchema rejects string "false" or extra properties', () => {
      const stringVal = UserStatusSchema.safeParse({ isActive: 'false' });
      expect(stringVal.success).toBe(false);

      const extraProp = UserStatusSchema.safeParse({ isActive: true, role: 'ADMIN' });
      expect(extraProp.success).toBe(false);
    });

    it('AuditLogQuerySchema constrains limit between 1 and 100', () => {
      const valid = AuditLogQuerySchema.safeParse({ limit: '25' });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.limit).toBe(25);
      }

      const tooHigh = AuditLogQuerySchema.safeParse({ limit: '500' });
      expect(tooHigh.success).toBe(false);

      const negative = AuditLogQuerySchema.safeParse({ limit: '-10' });
      expect(negative.success).toBe(false);

      const nonNumeric = AuditLogQuerySchema.safeParse({ limit: 'abc' });
      expect(nonNumeric.success).toBe(false);
    });
  });

  describe('AuthController Error Propagation', () => {
    let mockAuthUseCase: any;
    let authController: AuthController;

    beforeEach(() => {
      mockAuthUseCase = {
        login: jest.fn(),
        changePassword: jest.fn(),
        listUsers: jest.fn(),
        setUserActiveStatus: jest.fn()
      };
      authController = new AuthController(mockAuthUseCase);
    });

    it('login propagates unhandled errors to next() rather than returning raw 500', async () => {
      const testError = new Error('Database connection failed with sensitive password');
      mockAuthUseCase.login.mockRejectedValue(testError);

      const req: any = { body: { username: 'admin', password: 'password123' } };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(testError);
      expect(res.status).not.toHaveBeenCalledWith(500);
    });

    it('setUserStatus rejects non-boolean isActive with 400', async () => {
      const req: any = {
        params: { username: 'testuser' },
        body: { isActive: 'false' }, // String, not boolean
        user: { username: 'admin' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authController.setUserStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockAuthUseCase.setUserActiveStatus).not.toHaveBeenCalled();
    });

    it('setUserStatus passes boolean directly when valid', async () => {
      mockAuthUseCase.setUserActiveStatus.mockResolvedValue({ success: true, message: 'Status updated' });

      const req: any = {
        params: { username: 'testuser' },
        body: { isActive: false },
        user: { username: 'admin' }
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await authController.setUserStatus(req, res, next);

      expect(mockAuthUseCase.setUserActiveStatus).toHaveBeenCalledWith('testuser', false, 'admin');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
