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
    readonly handle?: string;
    readonly url?: string;
    readonly lastUpdated: string;
    constructor(props: PlatformMetricProps);
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
        handle: string | undefined;
        url: string | undefined;
        last_updated: string;
    };
}
