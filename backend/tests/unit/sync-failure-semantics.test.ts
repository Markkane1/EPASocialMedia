import { SyncPlatformsUseCase } from '../../src/application/use-cases/SyncPlatformsUseCase';
import { PlatformMetric } from '../../src/domain/entities/PlatformMetric';

describe('Sync Failure Semantics & Preservation (Item 12, H-23, M-16, M-17, M-18)', () => {
  let mockMetricsRepo: any;
  let initialMetrics: Record<string, PlatformMetric>;

  beforeEach(() => {
    initialMetrics = {
      facebook: new PlatformMetric({
        platform: 'facebook',
        name: 'EPA Punjab Facebook',
        followers: 25000,
        views: 100000,
        engagement: 5000,
        status: 'connected',
        isFallback: false
      }),
      instagram: new PlatformMetric({
        platform: 'instagram',
        name: 'EPA Punjab Instagram',
        followers: 2500,
        views: 50000,
        engagement: 1200,
        status: 'connected',
        isFallback: false
      })
    };

    mockMetricsRepo = {
      getPlatformMetrics: jest.fn().mockResolvedValue({ ...initialMetrics }),
      savePlatformMetrics: jest.fn().mockResolvedValue(undefined),
      getExecutiveSummary: jest.fn().mockResolvedValue(null),
      saveExecutiveSummary: jest.fn().mockResolvedValue(undefined),
      addSyncLog: jest.fn().mockResolvedValue(undefined)
    };
  });

  it('preserves existing metrics and returns status error when all fetchers fail', async () => {
    const failingFetcher1 = {
      platformKey: 'facebook',
      fetchMetrics: jest.fn().mockRejectedValue(new Error('Meta API 500'))
    };
    const failingFetcher2 = {
      platformKey: 'instagram',
      fetchMetrics: jest.fn().mockRejectedValue(new Error('Instagram rate limited'))
    };

    const useCase = new SyncPlatformsUseCase(mockMetricsRepo, [failingFetcher1, failingFetcher2] as any);
    const result = await useCase.execute();

    expect(result.status).toBe('error');
    // Ensure savePlatformMetrics is NOT called with an empty object
    expect(mockMetricsRepo.savePlatformMetrics).not.toHaveBeenCalled();
    // Ensure existing metrics are preserved in response
    expect(result.platforms['facebook'].followers).toBe(25000);
    expect(result.platforms['instagram'].followers).toBe(2500);
    // Ensure error log was added
    expect(mockMetricsRepo.addSyncLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' })
    );
  });

  it('merges metrics and returns status warning when partial fetchers fail', async () => {
    const failingFetcher = {
      platformKey: 'facebook',
      fetchMetrics: jest.fn().mockRejectedValue(new Error('Meta API 500'))
    };
    const successfulFetcher = {
      platformKey: 'instagram',
      fetchMetrics: jest.fn().mockResolvedValue(
        new PlatformMetric({
          platform: 'instagram',
          name: 'EPA Punjab Instagram',
          followers: 3000, // Updated follower count
          views: 60000,
          engagement: 1500,
          status: 'connected',
          isFallback: false
        })
      )
    };

    const useCase = new SyncPlatformsUseCase(mockMetricsRepo, [failingFetcher, successfulFetcher] as any);
    const result = await useCase.execute();

    expect(result.status).toBe('warning');
    // Merged: Facebook retains 25000, Instagram updated to 3000
    expect(result.platforms['facebook'].followers).toBe(25000);
    expect(result.platforms['instagram'].followers).toBe(3000);
    expect(mockMetricsRepo.savePlatformMetrics).toHaveBeenCalled();
    expect(mockMetricsRepo.addSyncLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'warning' })
    );
  });

  it('returns status success when all fetchers succeed', async () => {
    const fetcher1 = {
      platformKey: 'facebook',
      fetchMetrics: jest.fn().mockResolvedValue(
        new PlatformMetric({
          platform: 'facebook',
          name: 'EPA Punjab Facebook',
          followers: 26000,
          views: 120000,
          engagement: 6000,
          status: 'connected',
          isFallback: false
        })
      )
    };
    const fetcher2 = {
      platformKey: 'instagram',
      fetchMetrics: jest.fn().mockResolvedValue(
        new PlatformMetric({
          platform: 'instagram',
          name: 'EPA Punjab Instagram',
          followers: 3000,
          views: 60000,
          engagement: 1500,
          status: 'connected',
          isFallback: false
        })
      )
    };

    const useCase = new SyncPlatformsUseCase(mockMetricsRepo, [fetcher1, fetcher2] as any);
    const result = await useCase.execute();

    expect(result.status).toBe('success');
    expect(mockMetricsRepo.addSyncLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' })
    );
  });
});
