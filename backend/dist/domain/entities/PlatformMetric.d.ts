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
    watchTime?: number | null;
    watchTimeHrs?: number | null;
    newFollowers?: number;
    views: number;
    contentViews?: number;
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
export declare class PlatformMetric {
    readonly platform: string;
    readonly name: string;
    readonly followers: number;
    readonly watchTime: number | null;
    readonly watchTimeHrs: number | null;
    readonly newFollowers: number;
    readonly views: number;
    readonly contentViews: number;
    readonly impressions: number;
    readonly viewers: number;
    readonly reach: number;
    readonly linkClicks: number;
    readonly visits: number;
    readonly growth: Record<string, number>;
    readonly historicalTrends: DailyTrendPoint[];
    readonly engagement: number;
    readonly status: 'connected' | 'simulated' | 'error' | 'disconnected' | 'unauthenticated' | 'unconfigured';
    readonly isFallback: boolean;
    readonly dataSource: MetricDataSource;
    readonly dataQuality: MetricDataQuality;
    readonly retrievedAt: string;
    readonly handle?: string;
    readonly url?: string;
    readonly lastUpdated: string;
    constructor(props: PlatformMetricProps);
    /**
     * Checks if metric data is older than the configured threshold (default 24 hours)
     */
    isStale(maxAgeHours?: number): boolean;
    /**
     * Returns human-readable staleness status category
     */
    getStalenessStatus(maxAgeHours?: number): 'FRESH' | 'CACHED' | 'STALE';
    /**
     * Scales flow metrics based on reporting period multiplier.
     */
    scaleForPeriod(multiplier: number, is7d?: boolean): PlatformMetric;
    toJSON(): {
        platform: string;
        name: string;
        followers: number;
        watch_time: number | null;
        watch_time_hrs: number | null;
        new_followers: number;
        views: number;
        content_views: number;
        impressions: number;
        viewers: number;
        reach: number;
        link_clicks: number;
        visits: number;
        growth: Record<string, number>;
        historical_trends: DailyTrendPoint[];
        engagement: number;
        status: "error" | "connected" | "simulated" | "disconnected" | "unauthenticated" | "unconfigured";
        is_fallback: boolean;
        data_source: MetricDataSource;
        data_quality: MetricDataQuality;
        retrieved_at: string;
        is_stale: boolean;
        staleness_label: "STALE" | "FRESH" | "CACHED";
        handle: string | undefined;
        url: string | undefined;
        last_updated: string;
    };
}
