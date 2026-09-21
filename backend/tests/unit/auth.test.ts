import { AuthService } from '../../src/infrastructure/auth/AuthService';
import { AuthUseCase } from '../../src/application/use-cases/AuthUseCase';
import { PrismaUserRepository } from '../../src/infrastructure/database/PrismaUserRepository';

describe('AuthService & Cryptographic Security', () => {
  test('Hashes and verifies password with salt', () => {
    const pwd = 'TestSecretPassword@123';
    const hash = AuthService.hashPassword(pwd);
    expect(hash).toContain(':');
    expect(AuthService.verifyPassword(pwd, hash)).toBe(true);
    expect(AuthService.verifyPassword('WrongPassword', hash)).toBe(false);
  });

  test('Creates and verifies signed tokens', () => {
    const token = AuthService.createToken({
      username: 'admin',
      role: 'ADMIN',
      fullName: 'System Admin'
    });

    const payload = AuthService.verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.username).toBe('admin');
    expect(payload?.role).toBe('ADMIN');

    // Tampered token test
    const tampered = token + 'tamper';
    expect(AuthService.verifyToken(tampered)).toBeNull();
  });
});

describe('AuthUseCase & RBAC Roles', () => {
  const userRepo = new PrismaUserRepository();
  const authUseCase = new AuthUseCase(userRepo);

  test('Rejects invalid username or password', async () => {
    const res = await authUseCase.login('nonexistent', 'any');
    expect(res.success).toBe(false);

    const res2 = await authUseCase.login('admin', 'wrong_pass');
    expect(res2.success).toBe(false);
  });

  test('Authenticates admin and returns ADMIN role token', async () => {
    const res = await authUseCase.login('admin', 'Admin@EPAPunjab2026!');
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('ADMIN');
    expect(res.token).toBeDefined();

    const payload = await authUseCase.verifyToken(res.token!);
    expect(payload?.role).toBe('ADMIN');
  });

  test('Authenticates executive and returns EXECUTIVE role token', async () => {
    const res = await authUseCase.login('executive', 'Executive@EPAPunjab2026!');
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('EXECUTIVE');
  });
});
