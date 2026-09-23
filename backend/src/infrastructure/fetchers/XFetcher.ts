import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
import { LiveWebScraperService } from './LiveWebScraperService';

export class XFetcher implements ISocialFetcher {
  public readonly platformKey = 'x';
  private readonly username: string;
  private readonly bearerToken: string;

  constructor(username?: string, bearerToken?: string) {
    this.username = username || process.env.X_USERNAME || 'epapunjab';
    this.bearerToken = bearerToken || process.env.X_BEARER_TOKEN || '';
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    if (!this.bearerToken || !this.bearerToken.trim()) {
      return {
        status: 'ERROR',
        platform: 'x',
        message: 'X (Twitter) API Bearer token not configured (X_BEARER_TOKEN is missing). Please configure a valid Bearer token in Settings.'
      };
    }

    try {
      const cleanUser = this.username.replace('@', '');
      const url = `https://api.twitter.com/2/users/by/username/${cleanUser}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        },
        signal: AbortSignal.timeout(8000)
      });
      const data: any = await res.json();

      if (!res.ok || data.errors) {
        return {
          status: 'ERROR',
          platform: 'x',
          message: `X API error: ${data.errors?.[0]?.message || res.statusText}`,
          details: data
        };
      }

      return {
        status: 'OK',
        platform: 'x',
        message: `Successfully connected to X account: "@${data.data?.username}" (ID: ${data.data?.id})`
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        platform: 'x',
        message: `Network error connecting to X API v2: ${err.message}`
      };
    }
  }

  public async fetchMetrics(): Promise<PlatformMetric> {
    const scraped = await LiveWebScraperService.getMetrics('x');
    let followers = scraped.followers; // 1
    let newFollowers = 1;
    let views = scraped.reach; // 120
    let engagement = scraped.engagement; // 5
    const hasToken = !!(this.bearerToken && this.bearerToken.trim());
    let status: 'connected' | 'unauthenticated' | 'error' = hasToken ? 'connected' : 'unauthenticated';
    let isFallback = !hasToken;

    if (this.bearerToken && this.bearerToken.trim()) {
      try {
        const cleanUser = this.username.replace('@', '');
        const url = `https://api.twitter.com/2/users/by/username/${cleanUser}?user.fields=public_metrics`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          },
          signal: AbortSignal.timeout(8000)
        });
        if (res.ok) {
          const data: any = await res.json();
          if (data?.data?.public_metrics) {
            followers = data.data.public_metrics.followers_count ?? followers;
            status = 'connected';
            isFallback = false;
          }
        }
      } catch (err) {
        console.error('[X] Error fetching live Twitter API v2 metrics:', err);
      }
    }

    return new PlatformMetric({
      platform: 'x',
      name: 'EPA Punjab',
      handle: `@${this.username.replace('@', '')}`,
      url: `https://x.com/${this.username.replace('@', '')}`,
      followers,
      watchTime: null,
      watchTimeHrs: null,
      newFollowers,
      views,
      contentViews: views,
      engagement,
      status,
      isFallback
    });
  }
}
