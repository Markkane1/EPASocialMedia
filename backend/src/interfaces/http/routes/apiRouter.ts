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

import { authenticateToken, requireRole } from '../middlewares/authGuard';

export function createApiRouter(): Router {
  const router = Router();

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

  // 4. Public Routes
  router.get('/status', (req, res) => healthController.getStatus(req, res));
  router.get('/health', (req, res) => healthController.getStatus(req, res));
  router.get('/metrics', (req, res, next) => metricsController.getMetrics(req, res, next));
  router.post('/sync', (req, res, next) => syncController.syncAll(req, res, next));

  // 5. Authentication Routes
  router.post('/auth/login', (req, res) => authController.login(req, res));
  router.get('/auth/me', authenticateToken, (req, res) => authController.getMe(req, res));

  // 6. Role-Based Protected Routes (Admin Only)
  router.get('/config', authenticateToken, requireRole('ADMIN'), (req, res, next) => configController.getConfig(req, res, next));
  router.post('/config', authenticateToken, requireRole('ADMIN'), (req, res, next) => configController.updateConfig(req, res, next));
  router.post('/test-connection', authenticateToken, requireRole('ADMIN'), (req, res, next) => configController.testConnection(req, res, next));

  return router;
}
