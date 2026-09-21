import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
export declare class InstagramFetcher implements ISocialFetcher {
    readonly platformKey = "instagram";
    private readonly userId;
    private readonly accessToken;
    private readonly baseUrl;
    constructor(userId?: string, accessToken?: string);
    testConnection(): Promise<ConnectionTestResult>;
    fetchMetrics(): Promise<PlatformMetric>;
}
