import { PlatformMetric } from './PlatformMetric';
export interface ExecutiveSummaryProps {
    totalFollowers: number;
    watchTimeHrs: number;
    newFollowers: number;
    contentViews: number;
    engagement: number;
}
export declare class ExecutiveSummary {
    readonly totalFollowers: number;
    readonly watchTimeHrs: number;
    readonly newFollowers: number;
    readonly contentViews: number;
    readonly engagement: number;
    constructor(props: ExecutiveSummaryProps);
    /**
     * Aggregates summary statistics from an array of platform metrics.
     */
    static fromPlatformMetrics(metrics: PlatformMetric[]): ExecutiveSummary;
    toJSON(): {
        total_followers: number;
        watch_time_hrs: number;
        new_followers: number;
        content_views: number;
        engagement: number;
    };
}
