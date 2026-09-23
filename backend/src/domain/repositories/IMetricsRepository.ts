import { PlatformMetric } from '../entities/PlatformMetric';
import { ExecutiveSummary } from '../entities/ExecutiveSummary';
import { SyncLog } from '../entities/SyncLog';

export interface MetricsSnapshot {
  period: string;
  summary: ExecutiveSummary;
  platforms: Record<string, PlatformMetric>;
  lastSync: string;
  syncStatus: string;
  syncLogs: SyncLog[];
}

export interface IMetricsRepository {
  /**
   * Retrieves baseline or latest metrics for all platforms.
   */
  getAllPlatformMetrics(): Promise<Record<string, PlatformMetric>>;

  /**
   * Saves or updates platform metrics in persistence.
   */
  savePlatformMetrics(metrics: Record<string, PlatformMetric>): Promise<void>;

  /**
   * Saves executive summary snapshot.
   */
  saveExecutiveSummary(period: string, summary: ExecutiveSummary): Promise<void>;

  /**
   * Retrieves recent sync audit logs.
   */
  getRecentSyncLogs(limit?: number): Promise<SyncLog[]>;

  /**
   * Appends a new sync log entry.
   */
  addSyncLog(log: SyncLog): Promise<void>;

  /**
   * Retrieves the timestamp of the last successful sync.
   */
  getLastSyncTimestamp(): Promise<string>;

  /**
   * Applies data retention policy, pruning historical metric records,
   * executive summaries, and sync logs older than retentionDays (M-19, M-20, M-21).
   */
  applyRetentionPolicy?(retentionDays?: number): Promise<{ deletedMetrics: number; deletedSummaries: number; deletedLogs: number }>;
}
