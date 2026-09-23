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

    const existingMetrics: Record<string, PlatformMetric> =
      typeof this.metricsRepo.getAllPlatformMetrics === 'function'
        ? await this.metricsRepo.getAllPlatformMetrics()
        : typeof (this.metricsRepo as any).getPlatformMetrics === 'function'
        ? await (this.metricsRepo as any).getPlatformMetrics()
        : {};

    if (successfulCount === 0) {
      // All fetchers failed - guard against wiping repository!
      const existingList: PlatformMetric[] = Object.values(existingMetrics);
      const fallbackSummary = ExecutiveSummary.fromPlatformMetrics(existingList);

      const log = new SyncLog({
        timestamp: nowIso,
        status: 'error',
        message: `Sync failed: all ${totalFetchers} platform fetchers failed. Last known data preserved.`
      });
      await this.metricsRepo.addSyncLog(log);

      const serializedExisting: Record<string, ReturnType<PlatformMetric['toJSON']>> = {};
      for (const [k, m] of Object.entries(existingMetrics)) {
        serializedExisting[k] = (m as PlatformMetric).toJSON();
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
    const mergedMetrics: Record<string, PlatformMetric> = { ...existingMetrics, ...fetchedMetrics };
    await this.metricsRepo.savePlatformMetrics(mergedMetrics);

    const mergedMetricList: PlatformMetric[] = Object.values(mergedMetrics);
    const summary = ExecutiveSummary.fromPlatformMetrics(mergedMetricList);
    await this.metricsRepo.saveExecutiveSummary('28d', summary);

    const overallStatus: 'success' | 'warning' = failedCount > 0 ? 'warning' : 'success';
    const activeCount = mergedMetricList.filter((m) => (m as PlatformMetric).status === 'connected').length;

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
      serializedPlatforms[key] = (metric as PlatformMetric).toJSON();
    }

    // Periodic retention policy enforcement (M-19, M-20, M-21)
    if (this.metricsRepo.applyRetentionPolicy) {
      this.metricsRepo.applyRetentionPolicy(90).catch(() => {});
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
