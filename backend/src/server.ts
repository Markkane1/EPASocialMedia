import * as dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { PrismaClientSingleton } from './infrastructure/database/PrismaClientSingleton';

const PORT = parseInt(process.env.PORT || '8080', 10);

async function bootstrap() {
  console.log('='.repeat(60));
  console.log('EPA PUNJAB SOCIAL MEDIA DASHBOARD — BACKEND SERVICE');
  console.log('Clean Architecture | PostgreSQL Persistence | Prisma ORM');
  console.log('='.repeat(60));

  // Verify Database connectivity asynchronously
  await PrismaClientSingleton.checkConnection();

  const app = createApp();

  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`[SERVER] Backend service active on http://127.0.0.1:${PORT}`);
    console.log(`[SERVER] API Root: http://127.0.0.1:${PORT}/api/metrics`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[SERVER] Port ${PORT} busy, attempting fallback to 8081...`);
      app.listen(8081, '127.0.0.1', () => {
        console.log(`[SERVER] Backend service active on fallback http://127.0.0.1:8081`);
      });
    } else {
      console.error('[SERVER] Fatal server error:', err);
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
}

if (require.main === module) {
  bootstrap();
}
