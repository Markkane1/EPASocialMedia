import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
export declare class XFetcher implements ISocialFetcher {
    readonly platformKey = "x";
    private readonly username;
    private readonly bearerToken;
    constructor(username?: string, bearerToken?: string);
    testConnection(): Promise<ConnectionTestResult>;
    fetchMetrics(): Promise<PlatformMetric>;
}
