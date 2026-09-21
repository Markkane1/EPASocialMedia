"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTubeFetcher = void 0;
const PlatformMetric_1 = require("../../domain/entities/PlatformMetric");
class YouTubeFetcher {
    platformKey = 'youtube';
    async testConnection() {
        return {
            status: 'OK',
            platform: 'youtube',
            message: 'No YouTube channel launched yet by EPA Punjab (Channel Pending Launch).'
        };
    }
    async fetchMetrics() {
        return new PlatformMetric_1.PlatformMetric({
            platform: 'youtube',
            name: 'EPA Punjab Official',
            handle: 'Pending Channel Launch',
            url: 'https://www.youtube.com',
            followers: 0,
            watchTime: 0,
            watchTimeHrs: 0,
            newFollowers: 0,
            views: 0,
            contentViews: 0,
            engagement: 0,
            status: 'unconfigured',
            isFallback: true
        });
    }
}
exports.YouTubeFetcher = YouTubeFetcher;
//# sourceMappingURL=YouTubeFetcher.js.map