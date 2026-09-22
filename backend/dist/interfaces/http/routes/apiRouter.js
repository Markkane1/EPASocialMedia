"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRouter = createApiRouter;
const express_1 = require("express");
const PrismaMetricsRepository_1 = require("../../../infrastructure/database/PrismaMetricsRepository");
const PrismaConfigRepository_1 = require("../../../infrastructure/database/PrismaConfigRepository");
const PrismaUserRepository_1 = require("../../../infrastructure/database/PrismaUserRepository");
const FacebookFetcher_1 = require("../../../infrastructure/fetchers/FacebookFetcher");
const InstagramFetcher_1 = require("../../../infrastructure/fetchers/InstagramFetcher");
const YouTubeFetcher_1 = require("../../../infrastructure/fetchers/YouTubeFetcher");
const TikTokFetcher_1 = require("../../../infrastructure/fetchers/TikTokFetcher");
const XFetcher_1 = require("../../../infrastructure/fetchers/XFetcher");
const LinkedInFetcher_1 = require("../../../infrastructure/fetchers/LinkedInFetcher");
const GetMetricsUseCase_1 = require("../../../application/use-cases/GetMetricsUseCase");
const SyncPlatformsUseCase_1 = require("../../../application/use-cases/SyncPlatformsUseCase");
const ConfigUseCase_1 = require("../../../application/use-cases/ConfigUseCase");
const TestConnectionUseCase_1 = require("../../../application/use-cases/TestConnectionUseCase");
const AuthUseCase_1 = require("../../../application/use-cases/AuthUseCase");
const MetricsController_1 = require("../controllers/MetricsController");
const SyncController_1 = require("../controllers/SyncController");
const ConfigController_1 = require("../controllers/ConfigController");
const HealthController_1 = require("../controllers/HealthController");
const AuthController_1 = require("../controllers/AuthController");
const authGuard_1 = require("../middlewares/authGuard");
const validateRequest_1 = require("../middlewares/validateRequest");
const schemas_1 = require("../validation/schemas");
const RateLimiter_1 = require("../../../infrastructure/security/RateLimiter");
function createApiRouter() {
    const router = (0, express_1.Router)();
    // Rate Limiters
    const authLimiter = RateLimiter_1.RateLimiter.create({
        windowMs: 60 * 1000,
        max: 10,
        message: 'Too many authentication attempts.'
    });
    const syncLimiter = RateLimiter_1.RateLimiter.create({
        windowMs: 2 * 60 * 1000,
        max: 5,
        message: 'Too many synchronization requests.'
    });
    const configLimiter = RateLimiter_1.RateLimiter.create({
        windowMs: 60 * 1000,
        max: 20,
        message: 'Too many configuration updates.'
    });
    // 1. Repositories & Fetchers (Infrastructure)
    const metricsRepo = new PrismaMetricsRepository_1.PrismaMetricsRepository();
    const configRepo = new PrismaConfigRepository_1.PrismaConfigRepository();
    const userRepo = new PrismaUserRepository_1.PrismaUserRepository();
    const fetchers = [
        new FacebookFetcher_1.FacebookFetcher(),
        new InstagramFetcher_1.InstagramFetcher(),
        new YouTubeFetcher_1.YouTubeFetcher(),
        new TikTokFetcher_1.TikTokFetcher(),
        new XFetcher_1.XFetcher(),
        new LinkedInFetcher_1.LinkedInFetcher()
    ];
    // 2. Application Use Cases
    const getMetricsUseCase = new GetMetricsUseCase_1.GetMetricsUseCase(metricsRepo);
    const syncPlatformsUseCase = new SyncPlatformsUseCase_1.SyncPlatformsUseCase(metricsRepo, fetchers);
    const configUseCase = new ConfigUseCase_1.ConfigUseCase(configRepo);
    const testConnectionUseCase = new TestConnectionUseCase_1.TestConnectionUseCase(fetchers);
    const authUseCase = new AuthUseCase_1.AuthUseCase(userRepo);
    // 3. Presentation Controllers
    const metricsController = new MetricsController_1.MetricsController(getMetricsUseCase);
    const syncController = new SyncController_1.SyncController(syncPlatformsUseCase);
    const configController = new ConfigController_1.ConfigController(configUseCase, testConnectionUseCase);
    const healthController = new HealthController_1.HealthController();
    const authController = new AuthController_1.AuthController(authUseCase);
    // 4. Public Health & Diagnostic Routes
    router.get('/status', (req, res) => healthController.getStatus(req, res));
    router.get('/health', (req, res) => healthController.getStatus(req, res));
    // 5. Authentication Routes
    router.post('/auth/login', authLimiter, (0, validateRequest_1.validateBody)(schemas_1.LoginSchema), (req, res) => authController.login(req, res));
    router.get('/auth/me', authGuard_1.requireAuth, (req, res) => authController.getMe(req, res));
    router.post('/auth/logout', authGuard_1.requireAuth, (req, res) => authController.logout(req, res));
    router.post('/auth/change-password', authGuard_1.requireAuth, authLimiter, (0, validateRequest_1.validateBody)(schemas_1.ChangePasswordSchema), (req, res) => authController.changePassword(req, res));
    // 6. Protected Operational Routes (Authentication & Permission Required)
    router.get('/metrics', authGuard_1.requireAuth, (0, authGuard_1.requirePermission)('VIEW_METRICS'), (0, validateRequest_1.validateQuery)(schemas_1.MetricsQuerySchema), (req, res, next) => metricsController.getMetrics(req, res, next));
    router.post('/sync', authGuard_1.requireAuth, (0, authGuard_1.requirePermission)('TRIGGER_SYNC'), syncLimiter, (req, res, next) => syncController.syncAll(req, res, next));
    // 7. Role-Based Protected Routes (Admin Permissions Only)
    router.get('/config', authGuard_1.requireAuth, (0, authGuard_1.requirePermission)('MANAGE_CONFIG'), (req, res, next) => configController.getConfig(req, res, next));
    router.post('/config', authGuard_1.requireAuth, (0, authGuard_1.requirePermission)('MANAGE_CONFIG'), configLimiter, (0, validateRequest_1.validateBody)(schemas_1.UpdateConfigSchema), (req, res, next) => configController.updateConfig(req, res, next));
    router.post('/test-connection', authGuard_1.requireAuth, (0, authGuard_1.requirePermission)('TEST_CONNECTION'), configLimiter, (0, validateRequest_1.validateBody)(schemas_1.TestConnectionSchema), (req, res, next) => configController.testConnection(req, res, next));
    // 8. Audit Trail & Security Events (Admin Only)
    router.get('/audit-logs', authGuard_1.requireAuth, (0, authGuard_1.requirePermission)('MANAGE_CONFIG'), (req, res) => authController.getAuditLogs(req, res));
    // 9. User & Administrative Management Guardrails (Admin Only)
    router.get('/users', authGuard_1.requireAuth, (0, authGuard_1.requirePermission)('MANAGE_USERS'), (req, res) => authController.listUsers(req, res));
    router.post('/users/:username/status', authGuard_1.requireAuth, (0, authGuard_1.requirePermission)('MANAGE_USERS'), (req, res) => authController.setUserStatus(req, res));
    return router;
}
//# sourceMappingURL=apiRouter.js.map