import { IMetricsRepository } from '../../domain/repositories/IMetricsRepository';
import { ISocialFetcher } from '../../infrastructure/fetchers/ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
import { ExecutiveSummary } from '../../domain/entities/ExecutiveSummary';
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
export declare class SyncPlatformsUseCase {
    private readonly metricsRepo;
    private readonly fetchers;
    constructor(metricsRepo: IMetricsRepository, fetchers: ISocialFetcher[]);
    execute(): Promise<SyncResult>;
}
