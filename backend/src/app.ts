import express, { Express } from 'express';
import cors from 'cors';
import * as path from 'path';
import { requestLogger } from './interfaces/http/middlewares/requestLogger';
import { errorHandler } from './interfaces/http/middlewares/errorHandler';
import { createApiRouter } from './interfaces/http/routes/apiRouter';

import {
  securityHeaders,
  createCorsMiddleware,
  csrfProtection,
  apiNoCache
} from './interfaces/http/middlewares/securityHeaders';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers & Browser Hardening (CSP, nosniff, DENY frame, etc.)
  app.use(securityHeaders);

  // 2. Strict Whitelist-Enforced CORS
  app.use(createCorsMiddleware());

  // 3. Body Parsing with Strict Payload Size Limits (M-03)
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));
  app.use(requestLogger);

  // 4. CSRF Defense for State-Changing Requests
  app.use(csrfProtection);

  // Mount API Endpoints with Anti-Caching for Sensitive Operations Data (M-04)
  const apiRouter = createApiRouter();
  app.use('/api', apiNoCache, apiRouter);

  // Serve Frontend Assets (Clean separation: frontend static distribution)
  const frontendPublicDir = path.resolve(__dirname, '../../frontend/public');
  const frontendSrcDir = path.resolve(__dirname, '../../frontend/src');

  app.use(express.static(frontendPublicDir));
  app.use('/src', express.static(frontendSrcDir));

  // Default SPA route
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPublicDir, 'index.html'));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
