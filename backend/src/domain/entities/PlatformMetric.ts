export interface DailyTrendPoint {
  date: string;
  views: number;
  viewers: number;
  reach: number;
  impressions: number;
  interactions: number;
  linkClicks: number;
  visits: number;
  follows: number;
}

export type MetricDataSource = 'OFFICIAL_API' | 'PUBLIC_PROBE' | 'DATABASE_SNAPSHOT' | 'FALLBACK_STATIC';
export type MetricDataQuality = 'VERIFIED_LIVE' | 'ESTIMATED' | 'STALE' | 'FALLBACK';

export interface PlatformMetricProps {
  platform: string;
  name: string;
  followers: number;
  watchTime: number | null;
  watchTimeHrs: number | null;
  newFollowers: number;
  views: number;
  contentViews: number;
  impressions?: number;
  viewers?: number;
  reach?: number;
  linkClicks?: number;
  visits?: number;
  growth?: Record<string, number>;
  historicalTrends?: DailyTrendPoint[];
  engagement: number;
  status: 'connected' | 'simulated' | 'error' | 'disconnected' | 'unauthenticated' | 'unconfigured';
  isFallback: boolean;
  dataSource?: MetricDataSource;
  dataQuality?: MetricDataQuality;
  retrievedAt?: string;
  handle?: string;
  url?: string;
  lastUpdated?: string;
}

export class PlatformMetric {
  public readonly platform: string;
  public readonly name: string;
  public readonly followers: number;
  public readonly watchTime: number | null;
  public readonly watchTimeHrs: number | null;
  public readonly newFollowers: number;
  public readonly views: number;
  public readonly contentViews: number;
  public readonly impressions: number;
  public readonly viewers: number;
  public readonly reach: number;
  public readonly linkClicks: number;
  public readonly visits: number;
  public readonly growth: Record<string, number>;
  public readonly historicalTrends: DailyTrendPoint[];
  public readonly engagement: number;
  public readonly status: 'connected' | 'simulated' | 'error' | 'disconnected' | 'unauthenticated' | 'unconfigured';
  public readonly isFallback: boolean;
  public readonly dataSource: MetricDataSource;
  public readonly dataQuality: MetricDataQuality;
  public readonly retrievedAt: string;
  public readonly handle?: string;
  public readonly url?: string;
  public readonly lastUpdated: string;

  constructor(props: PlatformMetricProps) {
    this.platform = props.platform;
    this.name = props.name;
    this.followers = Math.max(0, props.followers);
    this.watchTime = props.watchTime;
    this.watchTimeHrs = props.watchTimeHrs;
    this.newFollowers = Math.max(0, props.newFollowers);
    this.views = Math.max(0, props.views);
    this.contentViews = Math.max(0, props.contentViews || props.views);
    this.impressions = Math.max(0, props.impressions ?? (props.contentViews || props.views));
    this.viewers = Math.max(0, props.viewers ?? Math.round(this.views * 0.3));
    this.reach = Math.max(0, props.reach ?? this.viewers);
    this.linkClicks = Math.max(0, props.linkClicks ?? 0);
    this.visits = Math.max(0, props.visits ?? 0);
    this.growth = props.growth || {};
    this.historicalTrends = props.historicalTrends || [];
    this.engagement = Math.max(0, props.engagement);
    this.status = props.status;
    this.isFallback = props.isFallback;
    this.lastUpdated = props.lastUpdated || new Date().toISOString();
    this.retrievedAt = props.retrievedAt || this.lastUpdated;
    this.dataSource = props.dataSource || (props.isFallback ? 'FALLBACK_STATIC' : 'OFFICIAL_API');
    this.dataQuality = props.dataQuality || (props.isFallback ? 'FALLBACK' : 'VERIFIED_LIVE');
    this.handle = props.handle;
    this.url = props.url;
  }

  /**
   * Checks if metric data is older than the configured threshold (default 24 hours)
   */
  public isStale(maxAgeHours: number = 24): boolean {
    const ageMs = Date.now() - new Date(this.retrievedAt).getTime();
    return isNaN(ageMs) || ageMs > maxAgeHours * 60 * 60 * 1000;
  }

  /**
   * Returns human-readable staleness status category
   */
  public getStalenessStatus(maxAgeHours: number = 24): 'FRESH' | 'CACHED' | 'STALE' {
    const ageMs = Date.now() - new Date(this.retrievedAt).getTime();
    if (isNaN(ageMs) || ageMs > maxAgeHours * 60 * 60 * 1000) return 'STALE';
    if (ageMs > 60 * 60 * 1000) return 'CACHED';
    return 'FRESH';
  }

  /**
   * Scales flow metrics based on reporting period multiplier.
   */
  public scaleForPeriod(multiplier: number, is7d: boolean = false): PlatformMetric {
    let scaledFollowers = this.followers;
    let scaledNewFollowers = this.newFollowers;

    if (is7d) {
      scaledNewFollowers = Math.round(this.newFollowers * 0.25);
      scaledFollowers = Math.max(0, this.followers - Math.round(this.newFollowers * 0.75));
    } else if (multiplier !== 1.0) {
      scaledNewFollowers = Math.round(this.newFollowers * multiplier);
    }

    const scaledViews = Math.round(this.views * multiplier);
    const scaledImpressions = Math.round(this.impressions * multiplier);
    const scaledViewers = Math.round(this.viewers * multiplier);
    const scaledReach = Math.round(this.reach * multiplier);
    const scaledLinkClicks = Math.round(this.linkClicks * multiplier);
    const scaledVisits = Math.round(this.visits * multiplier);
    const rawWt = this.watchTimeHrs !== null ? this.watchTimeHrs : this.watchTime;
    const scaledWt = rawWt !== null ? Math.round(rawWt * multiplier) : null;
    const scaledEngagement = Math.round(this.engagement * multiplier);

    return new PlatformMetric({
      ...this,
      followers: scaledFollowers,
      newFollowers: scaledNewFollowers,
      views: scaledViews,
      contentViews: scaledViews,
      impressions: scaledImpressions,
      viewers: scaledViewers,
      reach: scaledReach,
      linkClicks: scaledLinkClicks,
      visits: scaledVisits,
      watchTime: scaledWt,
      watchTimeHrs: scaledWt,
      engagement: scaledEngagement,
      dataSource: this.dataSource,
      dataQuality: multiplier === 1.0 && !is7d ? this.dataQuality : 'ESTIMATED',
      retrievedAt: this.retrievedAt
    });
  }

  public toJSON() {
    return {
      platform: this.platform,
      name: this.name,
      followers: this.followers,
      watch_time: this.watchTime,
      watch_time_hrs: this.watchTimeHrs,
      new_followers: this.newFollowers,
      views: this.views,
      content_views: this.contentViews,
      impressions: this.impressions,
      viewers: this.viewers,
      reach: this.reach,
      link_clicks: this.linkClicks,
      visits: this.visits,
      growth: this.growth,
      historical_trends: this.historicalTrends,
      engagement: this.engagement,
      status: this.status,
      is_fallback: this.isFallback,
      data_source: this.dataSource,
      data_quality: this.isStale() ? 'STALE' : this.dataQuality,
      retrieved_at: this.retrievedAt,
      is_stale: this.isStale(),
      staleness_label: this.getStalenessStatus(),
      handle: this.handle,
      url: this.url,
      last_updated: this.lastUpdated
    };
  }
}

