import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
export declare class TikTokFetcher implements ISocialFetcher {
    readonly platformKey = "tiktok";
    private readonly username;
    private readonly clientKey;
    private readonly clientSecret;
    constructor(username?: string, clientKey?: string, clientSecret?: string);
    testConnection(): Promise<ConnectionTestResult>;
    fetchMetrics(): Promise<PlatformMetric>;
}
