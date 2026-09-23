import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).min(1).max(50).trim(),
  password: z.string({ required_error: 'Password is required' }).min(1).max(128)
});

function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export const MetricsQuerySchema = z
  .object({
    period: z.enum(['7d', '28d', '90d', 'ytd', 'all', 'custom']).optional(),
    from: z.string().optional(),
    to: z.string().optional()
  })
  .refine((data) => {
    if (data.from && !isValidIsoDate(data.from)) return false;
    if (data.to && !isValidIsoDate(data.to)) return false;
    if (data.from && data.to) {
      return data.from <= data.to;
    }
    return true;
  }, { message: 'Invalid calendar date or "from" date must be earlier than or equal to "to" date' });

export const ALLOWED_CONFIG_KEYS = [
  'FB_PAGE_ID',
  'FB_ACCESS_TOKEN',
  'IG_USER_ID',
  'IG_ACCESS_TOKEN',
  'X_USERNAME',
  'X_BEARER_TOKEN',
  'LINKEDIN_VANITY_NAME',
  'LINKEDIN_ORGANIZATION_ID',
  'LINKEDIN_ACCESS_TOKEN',
  'TIKTOK_USERNAME',
  'TIKTOK_CLIENT_KEY',
  'TIKTOK_CLIENT_SECRET',
  'YOUTUBE_API_KEY',
  'YOUTUBE_CHANNEL_ID'
] as const;

export const FORBIDDEN_CONFIG_KEYS = [
  'DATABASE_URL',
  'PORT',
  'NODE_ENV',
  'JWT_SECRET',
  'SECRET',
  'PASSWORD',
  'ROLE',
  'ISADMIN'
] as const;

export const UpdateConfigSchema = z.record(z.string(), z.string()).refine(
  (data) => {
    const keys = Object.keys(data);
    for (const key of keys) {
      if ((FORBIDDEN_CONFIG_KEYS as readonly string[]).includes(key.toUpperCase())) {
        return false;
      }
      if (!(ALLOWED_CONFIG_KEYS as readonly string[]).includes(key)) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'Forbidden or unauthorized configuration key detected. Mass-assignment rejected.'
  }
);

export const TestConnectionSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'linkedin', 'x', 'youtube', 'general'])
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }).min(1),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

export const UserStatusSchema = z
  .object({
    isActive: z.boolean({ required_error: 'isActive must be a boolean' })
  })
  .strict();

export const AuditLogQuerySchema = z.object({
  limit: z
    .union([z.string().regex(/^[0-9]+$/, { message: 'limit must be a positive integer' }), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return 50;
      return typeof val === 'number' ? val : parseInt(val, 10);
    })
    .refine((val) => val >= 1 && val <= 100, {
      message: 'limit must be an integer between 1 and 100'
    })
});
