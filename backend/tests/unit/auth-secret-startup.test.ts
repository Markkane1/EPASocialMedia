import { AuthService } from '../../src/infrastructure/auth/AuthService';

describe('AuthService Production Secret Startup Validation (C-03)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('Succeeds in development mode without explicit JWT_SECRET', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    expect(() => AuthService.validateStartupConfig()).not.toThrow();
  });

  test('Throws fatal error in production when JWT_SECRET is unset', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => AuthService.validateStartupConfig()).toThrow(
      /In production, JWT_SECRET must be set as an environment variable/
    );
  });

  test('Throws fatal error in production when JWT_SECRET is shorter than 32 characters', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'too-short-secret';
    expect(() => AuthService.validateStartupConfig()).toThrow(
      /at least 32 characters/
    );
  });

  test('Throws fatal error in production when JWT_SECRET contains default dev string', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'EPA_PUNJAB_SECURE_AUTH_SECRET_2026_DEFAULT_KEY_THAT_IS_LONG';
    expect(() => AuthService.validateStartupConfig()).toThrow(
      /Refusing to run with default secret/
    );
  });

  test('Succeeds in production when a strong 32+ character JWT_SECRET is supplied', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a_very_strong_production_secret_key_exceeding_32_characters_2026!';
    expect(() => AuthService.validateStartupConfig()).not.toThrow();
  });
});
