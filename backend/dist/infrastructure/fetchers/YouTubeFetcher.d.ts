import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
export declare class YouTubeFetcher implements ISocialFetcher {
    readonly platformKey = "youtube";
    testConnection(): Promise<ConnectionTestResult>;
    fetchMetrics(): Promise<PlatformMetric>;
}
