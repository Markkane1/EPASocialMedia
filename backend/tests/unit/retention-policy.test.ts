import { PrismaMetricsRepository } from '../../src/infrastructure/database/PrismaMetricsRepository';
import { PrismaClientSingleton } from '../../src/infrastructure/database/PrismaClientSingleton';

describe('PostgreSQL Retention Policy & Maintenance (Item 20, M-19, M-20, M-21)', () => {
  let metricsRepo: PrismaMetricsRepository;
  let mockPrisma: any;

  beforeEach(() => {
    metricsRepo = new PrismaMetricsRepository();
    mockPrisma = {
      $transaction: jest.fn(),
      metricRecord: { deleteMany: jest.fn() },
      executiveSummary: { deleteMany: jest.fn() },
      syncAuditLog: { deleteMany: jest.fn() }
    };
    (PrismaClientSingleton as any).instance = mockPrisma;
    (PrismaClientSingleton as any).isConnected = true;
  });

  afterEach(() => {
    PrismaClientSingleton.reset();
  });

  it('prunes metric records, summaries, and logs older than cutoff days', async () => {
    mockPrisma.$transaction.mockResolvedValueOnce([
      { count: 120 }, // deleted metrics
      { count: 45 },  // deleted summaries
      { count: 30 }   // deleted logs
    ]);

    const result = await metricsRepo.applyRetentionPolicy(90);

    expect(result.deletedMetrics).toBe(120);
    expect(result.deletedSummaries).toBe(45);
    expect(result.deletedLogs).toBe(30);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('returns zeroes gracefully when database is unreachable', async () => {
    (PrismaClientSingleton as any).isConnected = false;

    const result = await metricsRepo.applyRetentionPolicy(90);

    expect(result.deletedMetrics).toBe(0);
    expect(result.deletedSummaries).toBe(0);
    expect(result.deletedLogs).toBe(0);
  });
});
