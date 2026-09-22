import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).min(1).max(50).trim(),
  password: z.string({ required_error: 'Password is required' }).min(1).max(128)
});

export const MetricsQuerySchema = z.object({
  period: z.enum(['7d', '28d', '90d', 'ytd', 'custom']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid from date format (YYYY-MM-DD)' }).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid to date format (YYYY-MM-DD)' }).optional()
});

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

