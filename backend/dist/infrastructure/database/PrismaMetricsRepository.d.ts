import { IMetricsRepository } from '../../domain/repositories/IMetricsRepository';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
import { ExecutiveSummary } from '../../domain/entities/ExecutiveSummary';
import { SyncLog } from '../../domain/entities/SyncLog';
export declare class PrismaMetricsRepository implements IMetricsRepository {
    private inMemoryMetrics;
    private inMemoryLogs;
    private lastSyncTime;
    constructor();
    getAllPlatformMetrics(): Promise<Record<string, PlatformMetric>>;
    savePlatformMetrics(metrics: Record<string, PlatformMetric>): Promise<void>;
    saveExecutiveSummary(period: string, summary: ExecutiveSummary): Promise<void>;
    getRecentSyncLogs(limit?: number): Promise<SyncLog[]>;
    addSyncLog(log: SyncLog): Promise<void>;
    getLastSyncTimestamp(): Promise<string>;
    /**
     * Applies data retention policy, purging metric records, summaries, and logs
     * older than retentionDays (defaults to 90 days). (M-19, M-20, M-21)
     */
    applyRetentionPolicy(retentionDays?: number): Promise<{
        deletedMetrics: number;
        deletedSummaries: number;
        deletedLogs: number;
    }>;
}
