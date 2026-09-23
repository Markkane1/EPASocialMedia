"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikTokFetcher = void 0;
const PlatformMetric_1 = require("../../domain/entities/PlatformMetric");
const LiveWebScraperService_1 = require("./LiveWebScraperService");
class TikTokFetcher {
    platformKey = 'tiktok';
    username;
    constructor(username) {
        this.username = username || process.env.TIKTOK_USERNAME || 'epapunjab';
    }
    async testConnection() {
        return {
            status: 'ERROR',
            platform: 'tiktok',
            message: 'Official TikTok API integration not configured (Client Key/Secret required). Falling back to unauthenticated public probe.'
        };
    }
    async fetchMetrics() {
        const scraped = await LiveWebScraperService_1.LiveWebScraperService.getMetrics('tiktok');
        let followers = scraped.followers; // 0
        let newFollowers = 0;
        let views = scraped.reach; // 500
        let engagement = scraped.engagement; // 4 likes
        let status = 'unauthenticated';
        let isFallback = true;
        return new PlatformMetric_1.PlatformMetric({
            platform: 'tiktok',
            name: 'epapunjab',
            handle: `@${this.username.replace('@', '')}`,
            url: `https://www.tiktok.com/@${this.username.replace('@', '')}`,
            followers,
            watchTime: null,
            watchTimeHrs: null,
            newFollowers,
            views,
            contentViews: views,
            engagement,
            status,
            isFallback,
            dataSource: 'PUBLIC_PROBE',
            dataQuality: 'ESTIMATED'
        });
    }
}
exports.TikTokFetcher = TikTokFetcher;
