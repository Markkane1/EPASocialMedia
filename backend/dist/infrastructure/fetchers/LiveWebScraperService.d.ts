export interface ScrapedPlatformMetrics {
    followers: number;
    reach: number;
    engagement: number;
    posts: number;
    status: string;
    verified: boolean;
}
export declare class LiveWebScraperService {
    private static cachedData;
    private static lastScrapeTime;
    private static isScraping;
    static getMetrics(platformKey: string): Promise<ScrapedPlatformMetrics>;
    static refreshLiveMetrics(): Promise<Record<string, ScrapedPlatformMetrics>>;
}
