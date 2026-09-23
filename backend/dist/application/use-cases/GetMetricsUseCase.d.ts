import { IMetricsRepository } from '../../domain/repositories/IMetricsRepository';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
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
        engagement: number;
    };
    platforms: Record<string, ReturnType<PlatformMetric['toJSON']>>;
    last_sync: string;
    sync_status: string;
    sync_logs: Array<{
        timestamp: string;
        status: string;
        message: string;
    }>;
    isEstimated?: boolean;
    provenance?: string;
}
export declare class GetMetricsUseCase {
    private readonly metricsRepo;
    constructor(metricsRepo: IMetricsRepository);
    execute(request: GetMetricsRequest): Promise<GetMetricsResponse>;
}
