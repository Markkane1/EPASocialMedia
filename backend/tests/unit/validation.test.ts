import {
  LoginSchema,
  MetricsQuerySchema,
  UpdateConfigSchema,
  TestConnectionSchema
} from '../../src/interfaces/http/validation/schemas';

describe('API Input Validation & Mass-Assignment Defenses', () => {
  describe('UpdateConfigSchema & Mass-Assignment Prevention', () => {
    test('Rejects dangerous server environment keys like DATABASE_URL, PORT, NODE_ENV', () => {
      const maliciousPayloads = [
        { DATABASE_URL: 'postgresql://attacker:evil@remote:5432/db' },
        { PORT: '9999' },
        { NODE_ENV: 'production' },
        { JWT_SECRET: 'attacker_controlled_secret' },
        { isAdmin: 'true' },
        { role: 'SUPERADMIN' }
      ];

      for (const payload of maliciousPayloads) {
        const result = UpdateConfigSchema.safeParse(payload);
        expect(result.success).toBe(false);
      }
    });

    test('Accepts valid allowed platform credentials and settings', () => {
      const validPayload = {
        FB_PAGE_ID: '785478874649452',
        FB_ACCESS_TOKEN: 'mock_fb_access_token_sample_value_123',
        IG_USER_ID: '17841476494927751',
        X_USERNAME: '@epapunjab'
      };

      const result = UpdateConfigSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('LoginSchema Validation', () => {
    test('Rejects empty username or password', () => {
      expect(LoginSchema.safeParse({ username: '', password: '123' }).success).toBe(false);
      expect(LoginSchema.safeParse({ username: 'admin', password: '' }).success).toBe(false);
      expect(LoginSchema.safeParse({}).success).toBe(false);
    });

    test('Accepts valid credentials format', () => {
      expect(LoginSchema.safeParse({ username: 'admin', password: 'ValidPassword123!' }).success).toBe(true);
    });
  });

  describe('MetricsQuerySchema Validation', () => {
    test('Rejects invalid date strings and unsupported periods', () => {
      expect(MetricsQuerySchema.safeParse({ period: 'invalid_period' }).success).toBe(false);
      expect(MetricsQuerySchema.safeParse({ from: '2026/02/01' }).success).toBe(false);
      expect(MetricsQuerySchema.safeParse({ to: 'yesterday' }).success).toBe(false);
    });

    test('Accepts valid standard periods and ISO dates', () => {
      expect(MetricsQuerySchema.safeParse({ period: '28d' }).success).toBe(true);
      expect(MetricsQuerySchema.safeParse({ from: '2026-02-01', to: '2026-02-14' }).success).toBe(true);
      expect(MetricsQuerySchema.safeParse({}).success).toBe(true);
    });
  });

  describe('TestConnectionSchema Validation', () => {
    test('Rejects unknown platform identifiers', () => {
      expect(TestConnectionSchema.safeParse({ platform: 'myspace' }).success).toBe(false);
      expect(TestConnectionSchema.safeParse({ platform: '../traversal' }).success).toBe(false);
    });

    test('Accepts registered platform channels', () => {
      expect(TestConnectionSchema.safeParse({ platform: 'facebook' }).success).toBe(true);
      expect(TestConnectionSchema.safeParse({ platform: 'instagram' }).success).toBe(true);
      expect(TestConnectionSchema.safeParse({ platform: 'linkedin' }).success).toBe(true);
    });
  });
});
