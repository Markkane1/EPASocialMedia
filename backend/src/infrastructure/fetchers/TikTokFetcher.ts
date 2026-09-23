import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
import { LiveWebScraperService } from './LiveWebScraperService';

export class TikTokFetcher implements ISocialFetcher {
  public readonly platformKey = 'tiktok';
  private readonly username: string;

  constructor(username?: string) {
    this.username = username || process.env.TIKTOK_USERNAME || 'epapunjab';
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    return {
      status: 'ERROR',
      platform: 'tiktok',
      message: 'Official TikTok API integration not configured (Client Key/Secret required). Falling back to unauthenticated public probe.'
    };
  }

  public async fetchMetrics(): Promise<PlatformMetric> {
    const scraped = await LiveWebScraperService.getMetrics('tiktok');
    let followers = scraped.followers; // 0
    let newFollowers = 0;
    let views = scraped.reach; // 500
    let engagement = scraped.engagement; // 4 likes
    let status: 'connected' | 'unauthenticated' | 'error' = 'unauthenticated';
    let isFallback = true;

    return new PlatformMetric({
      platform: 'tiktok',
      name: 'epapunjab',
      handle: `@${this.username.replace('@', '')}`,
      url: `https://www.tiktok.com/@${this.username.replace('@', '')}`,
      followers,
      watchTime: null,
      watchTimeHrs: null,
      newFollowers,
      views,
      contentViews: views,
      engagement,
      status,
      isFallback,
      dataSource: 'PUBLIC_PROBE',
      dataQuality: 'ESTIMATED'
    });
  }
}
