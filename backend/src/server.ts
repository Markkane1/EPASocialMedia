import * as dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { PrismaClientSingleton } from './infrastructure/database/PrismaClientSingleton';
import { AuthService } from './infrastructure/auth/AuthService';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  // Validate production security configuration
  AuthService.validateStartupConfig();

  // Verify Database connectivity asynchronously
  await PrismaClientSingleton.checkConnection();

  const app = createApp();

  const server = app.listen(PORT, HOST, () => {
    console.log(`[SERVER] Backend service active on http://${HOST}:${PORT}`);
    console.log(`[SERVER] API Root: http://${HOST}:${PORT}/api/metrics`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[FATAL] Port ${PORT} is already in use. Refusing to run on arbitrary fallback port in production.`);
      process.exit(1);
    } else {
      console.error('[SERVER] Fatal server error:', err);
      process.exit(1);
    }
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\n[SERVER] Gracefully shutting down...');
    server.close(async () => {
      const prisma = PrismaClientSingleton.getInstance();
      await prisma.$disconnect();
      console.log('[SERVER] All connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[SERVER] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[SERVER] Uncaught Exception:', err);
  });
}

if (require.main === module) {
  bootstrap();
}
