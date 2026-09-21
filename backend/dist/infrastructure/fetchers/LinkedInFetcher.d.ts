import { ISocialFetcher, ConnectionTestResult } from './ISocialFetcher';
import { PlatformMetric } from '../../domain/entities/PlatformMetric';
export declare class LinkedInFetcher implements ISocialFetcher {
    readonly platformKey = "linkedin";
    private readonly vanityName;
    private readonly orgId;
    private readonly accessToken;
    constructor(vanityName?: string, orgId?: string, accessToken?: string);
    testConnection(): Promise<ConnectionTestResult>;
    fetchMetrics(): Promise<PlatformMetric>;
}
