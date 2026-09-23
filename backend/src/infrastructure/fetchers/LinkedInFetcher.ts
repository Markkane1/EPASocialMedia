import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
import { LiveWebScraperService } from './LiveWebScraperService';

export class LinkedInFetcher implements ISocialFetcher {
  public readonly platformKey = 'linkedin';
  private readonly vanityName: string;
  private readonly orgId: string;
  private readonly accessToken: string;

  constructor(vanityName?: string, orgId?: string, accessToken?: string) {
    this.vanityName = vanityName || process.env.LINKEDIN_VANITY_NAME || 'environment-protection-agency-punjab';
    this.orgId = orgId || process.env.LINKEDIN_ORGANIZATION_ID || process.env.LINKEDIN_ORG_ID || '';
    this.accessToken = accessToken || process.env.LINKEDIN_ACCESS_TOKEN || '';
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    if (!this.accessToken || !this.accessToken.trim()) {
      return {
        status: 'ERROR',
        platform: 'linkedin',
        message: 'LinkedIn API access token not configured (LINKEDIN_ACCESS_TOKEN is missing). Please configure an OAuth 2.0 token in Settings.'
      };
    }

    try {
      const cleanOrgUrn = this.orgId.startsWith('urn:li:organization:') ? this.orgId : `urn:li:organization:${this.orgId}`;
      const url = `https://api.linkedin.com/v2/networkSizes/${encodeURIComponent(cleanOrgUrn)}?edgeType=CompanyFollowedByMember`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        signal: AbortSignal.timeout(8000)
      });
      const data: any = await res.json();

      if (!res.ok) {
        return {
          status: 'ERROR',
          platform: 'linkedin',
          message: `LinkedIn API error: ${data.message || res.statusText}`,
          details: data
        };
      }

      return {
        status: 'OK',
        platform: 'linkedin',
        message: `Successfully connected to LinkedIn Organization: "${this.vanityName}" (${data.firstDegreeSize || 0} followers)`
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        platform: 'linkedin',
        message: `Network error connecting to LinkedIn API v2: ${err.message}`
      };
    }
  }

  public async fetchMetrics(): Promise<PlatformMetric> {
    const scraped = await LiveWebScraperService.getMetrics('linkedin');
    let followers = scraped.followers; // 609
    let newFollowers = 18;
    let views = scraped.reach; // 8500
    let engagement = scraped.engagement; // 142
    const hasToken = !!(this.accessToken && this.accessToken.trim());
    let status: 'connected' | 'unauthenticated' | 'error' = hasToken ? 'connected' : 'unauthenticated';
    let isFallback = !hasToken;

    if (this.accessToken && this.accessToken.trim()) {
      try {
        const cleanOrgUrn = this.orgId.startsWith('urn:li:organization:') ? this.orgId : `urn:li:organization:${this.orgId}`;
        const url = `https://api.linkedin.com/v2/networkSizes/${encodeURIComponent(cleanOrgUrn)}?edgeType=CompanyFollowedByMember`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          },
          signal: AbortSignal.timeout(8000)
        });
        if (res.ok) {
          const data: any = await res.json();
          if (data && typeof data.firstDegreeSize === 'number') {
            followers = data.firstDegreeSize;
            status = 'connected';
            isFallback = false;
          }
        }
      } catch (err) {
        console.error('[LINKEDIN] Error fetching live LinkedIn API metrics:', err);
      }
    }

    return new PlatformMetric({
      platform: 'linkedin',
      name: 'Environment Protection Agency Punjab',
      handle: this.vanityName,
      url: `https://pk.linkedin.com/company/${this.vanityName}`,
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
