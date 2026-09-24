import { PlatformMetric } from './PlatformMetric';

export interface ExecutiveSummaryProps {
  totalFollowers: number;
  watchTimeHrs: number;
  newFollowers: number;
  contentViews: number;
  impressions?: number;
  totalImpressions?: number;
  engagement: number;
}

export class ExecutiveSummary {
  public readonly totalFollowers: number;
  public readonly watchTimeHrs: number;
  public readonly newFollowers: number;
  public readonly contentViews: number;
  public readonly impressions: number;
  public readonly totalImpressions: number;
  public readonly engagement: number;

  constructor(props: ExecutiveSummaryProps) {
    this.totalFollowers = props.totalFollowers;
    this.watchTimeHrs = props.watchTimeHrs;
    this.newFollowers = props.newFollowers;
    this.contentViews = props.contentViews;
    this.impressions = props.impressions ?? props.totalImpressions ?? props.contentViews;
    this.totalImpressions = this.impressions;
    this.engagement = props.engagement;
  }

  /**
   * Aggregates summary statistics from an array of platform metrics.
   */
  public static fromPlatformMetrics(metrics: PlatformMetric[]): ExecutiveSummary {
    const totalFollowers = metrics.reduce((acc, m) => acc + m.followers, 0);
    const watchTimeHrs = metrics.reduce((acc, m) => acc + (m.watchTimeHrs || m.watchTime || 0), 0);
    const newFollowers = metrics.reduce((acc, m) => acc + m.newFollowers, 0);
    const contentViews = metrics.reduce((acc, m) => acc + m.views, 0);
    const impressions = metrics.reduce((acc, m) => acc + (m.impressions || m.contentViews || m.views || 0), 0);
    const engagement = metrics.reduce((acc, m) => acc + m.engagement, 0);

    return new ExecutiveSummary({
      totalFollowers,
      watchTimeHrs,
      newFollowers,
      contentViews,
      impressions,
      totalImpressions: impressions,
      engagement
    });
  }

  public toJSON() {
    return {
      total_followers: this.totalFollowers,
      watch_time_hrs: this.watchTimeHrs,
      new_followers: this.newFollowers,
      content_views: this.contentViews,
      impressions: this.impressions,
      total_impressions: this.totalImpressions,
      engagement: this.engagement
    };
  }
}
