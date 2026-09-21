import { PlatformMetric } from '../../domain/entities/PlatformMetric';
export interface ConnectionTestResult {
    status: 'OK' | 'ERROR';
    platform: string;
    message: string;
    details?: any;
}
export interface ISocialFetcher {
    readonly platformKey: string;
    fetchMetrics(): Promise<PlatformMetric>;
    testConnection(): Promise<ConnectionTestResult>;
}
