import { Router } from 'express';
import { PrismaMetricsRepository } from '../../../infrastructure/database/PrismaMetricsRepository';
import { PrismaConfigRepository } from '../../../infrastructure/database/PrismaConfigRepository';
import { PrismaUserRepository } from '../../../infrastructure/database/PrismaUserRepository';

import { FacebookFetcher } from '../../../infrastructure/fetchers/FacebookFetcher';
import { InstagramFetcher } from '../../../infrastructure/fetchers/InstagramFetcher';
import { YouTubeFetcher } from '../../../infrastructure/fetchers/YouTubeFetcher';
import { TikTokFetcher } from '../../../infrastructure/fetchers/TikTokFetcher';
import { XFetcher } from '../../../infrastructure/fetchers/XFetcher';
import { LinkedInFetcher } from '../../../infrastructure/fetchers/LinkedInFetcher';

import { GetMetricsUseCase } from '../../../application/use-cases/GetMetricsUseCase';
import { SyncPlatformsUseCase } from '../../../application/use-cases/SyncPlatformsUseCase';
import { ConfigUseCase } from '../../../application/use-cases/ConfigUseCase';
import { TestConnectionUseCase } from '../../../application/use-cases/TestConnectionUseCase';
import { AuthUseCase } from '../../../application/use-cases/AuthUseCase';

import { MetricsController } from '../controllers/MetricsController';
import { SyncController } from '../controllers/SyncController';
import { ConfigController } from '../controllers/ConfigController';
import { HealthController } from '../controllers/HealthController';
import { AuthController } from '../controllers/AuthController';

import { requireAuth, requirePermission } from '../middlewares/authGuard';
import { validateBody, validateQuery } from '../middlewares/validateRequest';
import {
  LoginSchema,
  MetricsQuerySchema,
  UpdateConfigSchema,
  TestConnectionSchema,
  ChangePasswordSchema,
  UserStatusSchema,
  AuditLogQuerySchema
} from '../validation/schemas';
import { RateLimiter } from '../../../infrastructure/security/RateLimiter';

export function createApiRouter(): Router {
  const router = Router();

  // Rate Limiters
  const authLimiter = RateLimiter.create({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts.'
  });

  const syncLimiter = RateLimiter.create({
    windowMs: 2 * 60 * 1000,
    max: 5,
    message: 'Too many synchronization requests.'
  });

  const configLimiter = RateLimiter.create({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many configuration updates.'
  });

  // 1. Repositories & Fetchers (Infrastructure)
  const metricsRepo = new PrismaMetricsRepository();
  const configRepo = new PrismaConfigRepository();
  const userRepo = new PrismaUserRepository();

  const fetchers = [
    new FacebookFetcher(),
    new InstagramFetcher(),
    new YouTubeFetcher(),
    new TikTokFetcher(),
    new XFetcher(),
    new LinkedInFetcher()
  ];

  // 2. Application Use Cases
  const getMetricsUseCase = new GetMetricsUseCase(metricsRepo);
  const syncPlatformsUseCase = new SyncPlatformsUseCase(metricsRepo, fetchers);
  const configUseCase = new ConfigUseCase(configRepo);
  const testConnectionUseCase = new TestConnectionUseCase(fetchers);
  const authUseCase = new AuthUseCase(userRepo);

  // 3. Presentation Controllers
  const metricsController = new MetricsController(getMetricsUseCase);
  const syncController = new SyncController(syncPlatformsUseCase);
  const configController = new ConfigController(configUseCase, testConnectionUseCase);
  const healthController = new HealthController();
  const authController = new AuthController(authUseCase);

  // 4. Public Health & Diagnostic Routes
  router.get('/status', (req, res) => healthController.getStatus(req, res));
  router.get('/health', (req, res) => healthController.getStatus(req, res));

  // 5. Authentication Routes
  router.post('/auth/login', authLimiter, validateBody(LoginSchema), (req, res, next) => authController.login(req, res, next));
  router.get('/auth/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));
  router.post('/auth/logout', requireAuth, (req, res, next) => authController.logout(req, res, next));
  router.post('/auth/change-password', requireAuth, authLimiter, validateBody(ChangePasswordSchema), (req, res, next) =>
    authController.changePassword(req, res, next)
  );

  // 6. Protected Operational Routes (Authentication & Permission Required)
  router.get(
    '/metrics',
    requireAuth,
    requirePermission('VIEW_METRICS'),
    validateQuery(MetricsQuerySchema),
    (req, res, next) => metricsController.getMetrics(req, res, next)
  );
  router.post(
    '/sync',
    requireAuth,
    requirePermission('TRIGGER_SYNC'),
    syncLimiter,
    (req, res, next) => syncController.syncAll(req, res, next)
  );

  // 7. Role-Based Protected Routes (Admin Permissions Only)
  router.get(
    '/config',
    requireAuth,
    requirePermission('MANAGE_CONFIG'),
    (req, res, next) => configController.getConfig(req, res, next)
  );
  router.post(
    '/config',
    requireAuth,
    requirePermission('MANAGE_CONFIG'),
    configLimiter,
    validateBody(UpdateConfigSchema),
    (req, res, next) => configController.updateConfig(req, res, next)
  );
  router.post(
    '/test-connection',
    requireAuth,
    requirePermission('TEST_CONNECTION'),
    configLimiter,
    validateBody(TestConnectionSchema),
    (req, res, next) => configController.testConnection(req, res, next)
  );

  // 8. Audit Trail & Security Events (Admin Only)
  router.get(
    '/audit-logs',
    requireAuth,
    requirePermission('MANAGE_CONFIG'),
    validateQuery(AuditLogQuerySchema),
    (req, res, next) => authController.getAuditLogs(req, res, next)
  );

  // 9. User & Administrative Management Guardrails (Admin Only)
  router.get(
    '/users',
    requireAuth,
    requirePermission('MANAGE_USERS'),
    (req, res, next) => authController.listUsers(req, res, next)
  );
  router.post(
    '/users/:username/status',
    requireAuth,
    requirePermission('MANAGE_USERS'),
    validateBody(UserStatusSchema),
    (req, res, next) => authController.setUserStatus(req, res, next)
  );

  return router;
}
