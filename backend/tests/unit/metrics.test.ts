import { PlatformMetric } from '../../src/domain/entities/PlatformMetric';
import { ExecutiveSummary } from '../../src/domain/entities/ExecutiveSummary';
import { AppConfig } from '../../src/domain/entities/AppConfig';
import { GetMetricsUseCase } from '../../src/application/use-cases/GetMetricsUseCase';
import { IMetricsRepository } from '../../src/domain/repositories/IMetricsRepository';
import { SyncLog } from '../../src/domain/entities/SyncLog';

describe('Domain Entities & Calculation Rules', () => {
  test('PlatformMetric period scaling (7d vs 28d)', () => {
    const metric = new PlatformMetric({
      platform: 'facebook',
      name: 'EPA Punjab Official',
      followers: 570536,
      watchTime: 1707340,
      watchTimeHrs: 1707340,
      newFollowers: 311411,
      views: 105184633,
      contentViews: 105184633,
      engagement: 3728230,
      status: 'connected',
      isFallback: false
    });

    // 28d scaling (multiplier 1.0)
    const scaled28d = metric.scaleForPeriod(1.0, false);
    expect(scaled28d.followers).toBe(570536);
    expect(scaled28d.views).toBe(105184633);
    expect(scaled28d.newFollowers).toBe(311411);

    // 7d scaling (multiplier 0.25, is7d true)
    const scaled7d = metric.scaleForPeriod(0.25, true);
    expect(scaled7d.newFollowers).toBe(Math.round(311411 * 0.25));
    expect(scaled7d.views).toBe(Math.round(105184633 * 0.25));
    expect(scaled7d.followers).toBeLessThan(570536);
  });

  test('ExecutiveSummary aggregation across platforms', () => {
    const metrics = [
      new PlatformMetric({
        platform: 'facebook',
        name: 'Facebook',
        followers: 1000,
        watchTime: 50,
        watchTimeHrs: 50,
        newFollowers: 200,
        views: 5000,
        contentViews: 5000,
        engagement: 300,
        status: 'connected',
        isFallback: false
      }),
      new PlatformMetric({
        platform: 'youtube',
        name: 'YouTube',
        followers: 500,
        watchTime: 100,
        watchTimeHrs: 100,
        newFollowers: 50,
        views: 2000,
        contentViews: 2000,
        engagement: 150,
        status: 'connected',
        isFallback: false
      })
    ];

    const summary = ExecutiveSummary.fromPlatformMetrics(metrics);
    expect(summary.totalFollowers).toBe(1500);
    expect(summary.watchTimeHrs).toBe(150);
    expect(summary.newFollowers).toBe(250);
    expect(summary.contentViews).toBe(7000);
    expect(summary.engagement).toBe(450);
  });

  test('AppConfig key masking for sensitive tokens', () => {
    const config = new AppConfig([
      { key: 'FB_PAGE_ID', value: 'epapunjab', isSensitive: false },
      { key: 'FB_ACCESS_TOKEN', value: 'EAAB1234567890XYZ', isSensitive: true }
    ]);

    const masked = config.getAllMasked();
    expect(masked['FB_PAGE_ID']).toBe('epapunjab');
    expect(masked['FB_ACCESS_TOKEN']).toContain('••••••••');
    expect(masked['FB_ACCESS_TOKEN'].startsWith('EAAB')).toBe(true);
    expect(masked['FB_ACCESS_TOKEN'].endsWith('0XYZ')).toBe(true);
  });
});

describe('GetMetricsUseCase Application Service', () => {
  test('Returns accurate formatted metrics response', async () => {
    const mockRepo: IMetricsRepository = {
      getAllPlatformMetrics: async () => ({
        facebook: new PlatformMetric({
          platform: 'facebook',
          name: 'Facebook',
          followers: 10000,
          watchTime: 500,
          watchTimeHrs: 500,
          newFollowers: 1000,
          views: 50000,
          contentViews: 50000,
          engagement: 2000,
          status: 'connected',
          isFallback: false
        })
      }),
      savePlatformMetrics: async () => {},
      saveExecutiveSummary: async () => {},
      getRecentSyncLogs: async () => [
        new SyncLog({
          timestamp: '2026-09-21T00:00:00Z',
          status: 'initialized',
          message: 'Initialized test store'
        })
      ],
      addSyncLog: async () => {},
      getLastSyncTimestamp: async () => '2026-09-21T00:00:00Z'
    };

    const useCase = new GetMetricsUseCase(mockRepo);
    const result = await useCase.execute({ period: '28d' });

    expect(result.period).toBe('28d');
    expect(result.summary.total_followers).toBe(10000);
    expect(result.platforms.facebook).toBeDefined();
    expect(result.platforms.facebook.followers).toBe(10000);
    expect(result.sync_status).toBe('synced');
  });
});
