import { MetricsQuerySchema } from '../../src/interfaces/http/validation/schemas';
import { GetMetricsUseCase } from '../../src/application/use-cases/GetMetricsUseCase';
import { PrismaMetricsRepository } from '../../src/infrastructure/database/PrismaMetricsRepository';

describe('Metrics Query Validation & Period Reporting Integrity (H-18 to H-22)', () => {
  describe('MetricsQuerySchema Strict Date Validation', () => {
    test('Rejects impossible calendar dates (e.g. 2026-99-99)', () => {
      const result = MetricsQuerySchema.safeParse({ from: '2026-99-99', to: '2026-10-01' });
      expect(result.success).toBe(false);
    });

    test('Rejects invalid calendar month (e.g. 2026-13-10)', () => {
      const result = MetricsQuerySchema.safeParse({ from: '2026-13-10' });
      expect(result.success).toBe(false);
    });

    test('Rejects invalid day for February (e.g. 2026-02-30)', () => {
      const result = MetricsQuerySchema.safeParse({ from: '2026-02-30', to: '2026-03-01' });
      expect(result.success).toBe(false);
    });

    test('Rejects inverted date range (from > to)', () => {
      const result = MetricsQuerySchema.safeParse({ from: '2026-08-15', to: '2026-08-01' });
      expect(result.success).toBe(false);
    });

    test('Accepts valid ISO calendar dates and chronological range', () => {
      const result = MetricsQuerySchema.safeParse({ from: '2026-08-01', to: '2026-08-28' });
      expect(result.success).toBe(true);
    });

    test('Accepts valid predefined period codes', () => {
      expect(MetricsQuerySchema.safeParse({ period: '7d' }).success).toBe(true);
      expect(MetricsQuerySchema.safeParse({ period: '28d' }).success).toBe(true);
      expect(MetricsQuerySchema.safeParse({ period: '90d' }).success).toBe(true);
      expect(MetricsQuerySchema.safeParse({ period: 'ytd' }).success).toBe(true);
      expect(MetricsQuerySchema.safeParse({ period: 'all' }).success).toBe(true);
    });
  });

  describe('GetMetricsUseCase Provenance & Historical Filtering', () => {
    let useCase: GetMetricsUseCase;

    beforeEach(() => {
      const repo = new PrismaMetricsRepository();
      useCase = new GetMetricsUseCase(repo);
    });

    test('Marks 28d period as DIRECT_SNAPSHOT with isEstimated: false', async () => {
      const res = await useCase.execute({ period: '28d' });
      expect(res.period).toBe('28d');
      expect(res.isEstimated).toBe(false);
      expect(res.provenance).toBe('DIRECT_SNAPSHOT');
    });

    test('Marks scaled period (90d) as ESTIMATED_PERIOD_SCALING with isEstimated: true', async () => {
      const res = await useCase.execute({ period: '90d' });
      expect(res.period).toBe('90d');
      expect(res.isEstimated).toBe(true);
      expect(res.provenance).toBe('ESTIMATED_PERIOD_SCALING');
    });
  });
});
