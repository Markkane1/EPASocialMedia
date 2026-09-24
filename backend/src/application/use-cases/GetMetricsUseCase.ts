import { IMetricsRepository } from '../../domain/repositories/IMetricsRepository';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
import { ExecutiveSummary } from '../../domain/entities/ExecutiveSummary';

export interface GetMetricsRequest {
  period?: string;
  from?: string;
  to?: string;
}

export interface GetMetricsResponse {
  period: string;
  dateRange: {
    from: string;
    to: string;
    days: number;
    formatted: string;
  };
  summary: {
    total_followers: number;
    watch_time_hrs: number;
    new_followers: number;
    content_views: number;
    impressions?: number;
    total_impressions?: number;
    engagement: number;
  };
  platforms: Record<string, ReturnType<PlatformMetric['toJSON']>>;
  last_sync: string;
  sync_status: string;
  sync_logs: Array<{ timestamp: string; status: string; message: string }>;
  isEstimated?: boolean;
  provenance?: string;
}

export class GetMetricsUseCase {
  constructor(private readonly metricsRepo: IMetricsRepository) {}

  public async execute(request: GetMetricsRequest): Promise<GetMetricsResponse> {
    let multiplier = 1.0;
    let days = 28;
    let fromDateStr = '';
    let toDateStr = '';
    let period = (request.period || '28d').toLowerCase().trim();

    const now = new Date();
    const toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (request.from && request.to) {
      const parsedFrom = new Date(request.from);
      const parsedTo = new Date(request.to);

      if (!isNaN(parsedFrom.getTime()) && !isNaN(parsedTo.getTime()) && parsedTo >= parsedFrom) {
        period = 'custom';
        const diffMs = parsedTo.getTime() - parsedFrom.getTime();
        days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
        multiplier = days / 28.0;
        fromDateStr = parsedFrom.toISOString().split('T')[0];
        toDateStr = parsedTo.toISOString().split('T')[0];
      }
    }

    if (!fromDateStr || !toDateStr) {
      if (period === '7d') {
        days = 7;
        multiplier = 7 / 28;
      } else if (period === '90d') {
        days = 90;
        multiplier = 90 / 28;
      } else if (period === 'ytd') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        days = Math.max(1, Math.round((toDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)));
        multiplier = days / 28;
      } else if (period === 'all') {
        days = 365;
        multiplier = 365 / 28;
      } else {
        period = '28d';
        days = 28;
        multiplier = 1.0;
      }

      const calculatedFrom = new Date(toDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      fromDateStr = calculatedFrom.toISOString().split('T')[0];
      toDateStr = toDate.toISOString().split('T')[0];
    }

    const basePlatforms = await this.metricsRepo.getAllPlatformMetrics();
    const lastSync = await this.metricsRepo.getLastSyncTimestamp();
    const recentLogs = await this.metricsRepo.getRecentSyncLogs(5);

    const scaledPlatforms: Record<string, PlatformMetric> = {};
    const scaledList: PlatformMetric[] = [];
    const is7d = days === 7;

    for (const [key, metric] of Object.entries(basePlatforms)) {
      const scaled = metric.scaleForPeriod(multiplier, is7d);
      const filteredTrends = scaled.historicalTrends && scaled.historicalTrends.length > 0
        ? scaled.historicalTrends.filter(pt => (!fromDateStr || pt.date >= fromDateStr) && (!toDateStr || pt.date <= toDateStr))
        : scaled.historicalTrends;

      const adjustedMetric = new PlatformMetric({
        ...scaled,
        historicalTrends: (filteredTrends && filteredTrends.length > 0) ? filteredTrends : scaled.historicalTrends
      });

      scaledPlatforms[key] = adjustedMetric;
      scaledList.push(adjustedMetric);
    }

    const summary = ExecutiveSummary.fromPlatformMetrics(scaledList);

    const serializedPlatforms: Record<string, ReturnType<PlatformMetric['toJSON']>> = {};
    for (const [key, metric] of Object.entries(scaledPlatforms)) {
      serializedPlatforms[key] = metric.toJSON();
    }

    return {
      period,
      dateRange: {
        from: fromDateStr,
        to: toDateStr,
        days,
        formatted: `${fromDateStr} to ${toDateStr} (${days} Days)`
      },
      summary: summary.toJSON(),
      platforms: serializedPlatforms,
      last_sync: lastSync,
      sync_status: 'synced',
      sync_logs: recentLogs.map(l => l.toJSON()),
      isEstimated: period !== '28d',
      provenance: period === '28d' ? 'DIRECT_SNAPSHOT' : 'ESTIMATED_PERIOD_SCALING'
    };
  }
}
