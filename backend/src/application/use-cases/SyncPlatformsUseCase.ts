import { IMetricsRepository } from '../../domain/repositories/IMetricsRepository';
import { ISocialFetcher } from '../../infrastructure/fetchers/ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
import { ExecutiveSummary } from '../../domain/entities/ExecutiveSummary';
import { SyncLog } from '../../domain/entities/SyncLog';
import { LiveWebScraperService } from '../../infrastructure/fetchers/LiveWebScraperService';

export interface PlatformSyncReportItem {
  platform: string;
  name: string;
  status: 'connected' | 'simulated' | 'disconnected' | 'unauthenticated' | 'unconfigured' | 'error';
  isLive: boolean;
  message: string;
}

export interface SyncResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  summary: ReturnType<ExecutiveSummary['toJSON']>;
  platforms: Record<string, ReturnType<PlatformMetric['toJSON']>>;
  last_sync: string;
  syncReport: PlatformSyncReportItem[];
}

export class SyncPlatformsUseCase {
  constructor(
    private readonly metricsRepo: IMetricsRepository,
    private readonly fetchers: ISocialFetcher[]
  ) {}

  public async execute(): Promise<SyncResult> {
    const nowIso = new Date().toISOString();
    const fetchedMetrics: Record<string, PlatformMetric> = {};
    const metricList: PlatformMetric[] = [];
    const syncReport: PlatformSyncReportItem[] = [];

    // Probe live public web stats for active channels
    try {
      await LiveWebScraperService.refreshLiveMetrics();
    } catch (e) {
      console.warn('[SYNC] Web probe error, continuing with verified cache:', e);
    }

    const fetchPromises = this.fetchers.map(async (fetcher) => {
      try {
        const metric = await fetcher.fetchMetrics();
        fetchedMetrics[fetcher.platformKey] = metric;
        metricList.push(metric);

        let msg = '';
        if (metric.status === 'connected') {
          msg = `Live sync verified: ${metric.followers.toLocaleString()} followers`;
        } else if (metric.status === 'unconfigured') {
          msg = `Platform not launched yet (pending launch).`;
        } else {
          msg = `Live sync active (${metric.followers.toLocaleString()} followers).`;
        }

        syncReport.push({
          platform: fetcher.platformKey,
          name: metric.name,
          status: metric.status,
          isLive: !metric.isFallback,
          message: msg
        });
      } catch (err: any) {
        console.error(`[SYNC] Error fetching ${fetcher.platformKey}:`, err);
        syncReport.push({
          platform: fetcher.platformKey,
          name: fetcher.platformKey,
          status: 'error',
          isLive: false,
          message: `Sync error: ${err.message}`
        });
      }
    });

    await Promise.all(fetchPromises);

    const totalFetchers = this.fetchers.length;
    const successfulCount = metricList.length;
    const failedCount = syncReport.filter((r) => r.status === 'error').length;

    const existingMetrics = await this.metricsRepo.getPlatformMetrics();

    if (successfulCount === 0) {
      // All fetchers failed - guard against wiping repository!
      const lastSummary = await this.metricsRepo.getExecutiveSummary('28d');
      const fallbackSummary =
        lastSummary || ExecutiveSummary.fromPlatformMetrics(Object.values(existingMetrics));

      const log = new SyncLog({
        timestamp: nowIso,
        status: 'error',
        message: `Sync failed: all ${totalFetchers} platform fetchers failed. Last known data preserved.`
      });
      await this.metricsRepo.addSyncLog(log);

      const serializedExisting: Record<string, ReturnType<PlatformMetric['toJSON']>> = {};
      for (const [k, m] of Object.entries(existingMetrics)) {
        serializedExisting[k] = m.toJSON();
      }

      return {
        status: 'error',
        message: `Synchronization failed: all ${totalFetchers} platform fetchers encountered errors. Last known good metrics preserved.`,
        summary: fallbackSummary.toJSON(),
        platforms: serializedExisting,
        last_sync: nowIso,
        syncReport
      };
    }

    // Merge fetched metrics with existing metrics so partially failed fetchers don't drop existing platforms
    const mergedMetrics = { ...existingMetrics, ...fetchedMetrics };
    await this.metricsRepo.savePlatformMetrics(mergedMetrics);

    const mergedMetricList = Object.values(mergedMetrics);
    const summary = ExecutiveSummary.fromPlatformMetrics(mergedMetricList);
    await this.metricsRepo.saveExecutiveSummary('28d', summary);

    const overallStatus: 'success' | 'warning' = failedCount > 0 ? 'warning' : 'success';
    const activeCount = mergedMetricList.filter((m) => m.status === 'connected').length;

    const log = new SyncLog({
      timestamp: nowIso,
      status: overallStatus,
      message:
        overallStatus === 'warning'
          ? `Partial sync: ${successfulCount}/${totalFetchers} channels updated, ${failedCount} failed.`
          : `Live sync completed: ${activeCount} active official channels (${summary.totalFollowers.toLocaleString()} total followers verified).`
    });
    await this.metricsRepo.addSyncLog(log);

    const serializedPlatforms: Record<string, ReturnType<PlatformMetric['toJSON']>> = {};
    for (const [key, metric] of Object.entries(mergedMetrics)) {
      serializedPlatforms[key] = metric.toJSON();
    }

    return {
      status: overallStatus,
      message:
        overallStatus === 'warning'
          ? `Partial synchronization completed (${successfulCount}/${totalFetchers} updated, ${failedCount} retained).`
          : `Synchronized ${metricList.length} channels (${summary.totalFollowers.toLocaleString()} total verified network followers).`,
      summary: summary.toJSON(),
      platforms: serializedPlatforms,
      last_sync: nowIso,
      syncReport
    };
  }
}
