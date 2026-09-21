import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';

export class YouTubeFetcher implements ISocialFetcher {
  public readonly platformKey = 'youtube';

  public async testConnection(): Promise<ConnectionTestResult> {
    return {
      status: 'OK',
      platform: 'youtube',
      message: 'No YouTube channel launched yet by EPA Punjab (Channel Pending Launch).'
    };
  }

  public async fetchMetrics(): Promise<PlatformMetric> {
    return new PlatformMetric({
      platform: 'youtube',
      name: 'EPA Punjab Official',
      handle: 'Pending Channel Launch',
      url: 'https://www.youtube.com',
      followers: 0,
      watchTime: 0,
      watchTimeHrs: 0,
      newFollowers: 0,
      views: 0,
      contentViews: 0,
      engagement: 0,
      status: 'unconfigured',
      isFallback: true
    });
  }
}
