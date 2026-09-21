import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
export declare class FacebookFetcher implements ISocialFetcher {
    readonly platformKey = "facebook";
    private readonly pageId;
    private readonly accessToken;
    private readonly baseUrl;
    constructor(pageId?: string, accessToken?: string);
    testConnection(): Promise<ConnectionTestResult>;
    fetchMetrics(): Promise<PlatformMetric>;
}
