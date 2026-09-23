import { PlatformMetric } from '../../src/domain/entities/PlatformMetric';

describe('Metric Provenance and Staleness Tracking (Item 15, M-22, M-23)', () => {
  it('correctly tracks provenance for official API and fallback metrics', () => {
    const liveMetric = new PlatformMetric({
      platform: 'facebook',
      name: 'EPA Punjab Facebook',
      followers: 26000,
      views: 100000,
      engagement: 5000,
      status: 'connected',
      isFallback: false,
      dataSource: 'OFFICIAL_API',
      dataQuality: 'VERIFIED_LIVE'
    });

    expect(liveMetric.dataSource).toBe('OFFICIAL_API');
    expect(liveMetric.dataQuality).toBe('VERIFIED_LIVE');
    expect(liveMetric.isStale()).toBe(false);
    expect(liveMetric.getStalenessStatus()).toBe('FRESH');

    const json = liveMetric.toJSON();
    expect(json.data_source).toBe('OFFICIAL_API');
    expect(json.data_quality).toBe('VERIFIED_LIVE');
    expect(json.is_stale).toBe(false);
    expect(json.staleness_label).toBe('FRESH');
  });

  it('identifies stale metrics based on configured age threshold', () => {
    // 30 hours ago
    const oldTimestamp = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();

    const staleMetric = new PlatformMetric({
      platform: 'x',
      name: 'EPA Punjab X',
      followers: 10,
      views: 500,
      engagement: 20,
      status: 'connected',
      isFallback: false,
      dataSource: 'PUBLIC_PROBE',
      dataQuality: 'VERIFIED_LIVE',
      retrievedAt: oldTimestamp,
      lastUpdated: oldTimestamp
    });

    expect(staleMetric.isStale(24)).toBe(true);
    expect(staleMetric.getStalenessStatus(24)).toBe('STALE');

    const json = staleMetric.toJSON();
    expect(json.is_stale).toBe(true);
    expect(json.data_quality).toBe('STALE');
    expect(json.staleness_label).toBe('STALE');
  });

  it('marks scaled period metrics as ESTIMATED quality', () => {
    const baseMetric = new PlatformMetric({
      platform: 'facebook',
      name: 'EPA Punjab Facebook',
      followers: 20000,
      newFollowers: 1000,
      views: 50000,
      engagement: 2500,
      status: 'connected',
      isFallback: false,
      dataSource: 'OFFICIAL_API',
      dataQuality: 'VERIFIED_LIVE'
    });

    const scaled = baseMetric.scaleForPeriod(0.25, true);
    expect(scaled.dataQuality).toBe('ESTIMATED');
    expect(scaled.toJSON().data_quality).toBe('ESTIMATED');
  });
});
