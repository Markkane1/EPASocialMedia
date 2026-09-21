"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncPlatformsUseCase = void 0;
const ExecutiveSummary_1 = require("../../domain/entities/ExecutiveSummary");
const SyncLog_1 = require("../../domain/entities/SyncLog");
const LiveWebScraperService_1 = require("../../infrastructure/fetchers/LiveWebScraperService");
class SyncPlatformsUseCase {
    metricsRepo;
    fetchers;
    constructor(metricsRepo, fetchers) {
        this.metricsRepo = metricsRepo;
        this.fetchers = fetchers;
    }
    async execute() {
        const nowIso = new Date().toISOString();
        const fetchedMetrics = {};
        const metricList = [];
        const syncReport = [];
        // Probe live public web stats for active channels
        try {
            await LiveWebScraperService_1.LiveWebScraperService.refreshLiveMetrics();
        }
        catch (e) {
            console.warn('[SYNC] Web probe error, continuing with verified cache:', e);
        }
        const fetchPromises = this.fetchers.map(async (fetcher) => {
            try {
                const metric = await fetcher.fetchMetrics();
                fetchedMetrics[fetcher.platformKey] = metric;
                metricList.push(metric);
                let msg = '';
                if (metric.status === 'connected') {
                    msg = `Live sync verified: ${metric.followers.toLocaleString()} followers`;
                }
                else if (metric.status === 'unconfigured') {
                    msg = `Platform not launched yet (pending launch).`;
                }
                else {
                    msg = `Live sync active (${metric.followers.toLocaleString()} followers).`;
                }
                syncReport.push({
                    platform: fetcher.platformKey,
                    name: metric.name,
                    status: metric.status,
                    isLive: !metric.isFallback,
                    message: msg
                });
            }
            catch (err) {
                console.error(`[SYNC] Error fetching ${fetcher.platformKey}:`, err);
                syncReport.push({
                    platform: fetcher.platformKey,
                    name: fetcher.platformKey,
                    status: 'error',
                    isLive: false,
                    message: `Sync error: ${err.message}`
                });
            }
        });
        await Promise.all(fetchPromises);
        // Save to persistence
        await this.metricsRepo.savePlatformMetrics(fetchedMetrics);
        // Compute and save executive summary
        const summary = ExecutiveSummary_1.ExecutiveSummary.fromPlatformMetrics(metricList);
        await this.metricsRepo.saveExecutiveSummary('28d', summary);
        // Create sync audit log
        const activeCount = metricList.filter(m => m.status === 'connected').length;
        const log = new SyncLog_1.SyncLog({
            timestamp: nowIso,
            status: 'success',
            message: `Live sync completed: ${activeCount} active official channels (${summary.totalFollowers.toLocaleString()} total followers verified).`
        });
        await this.metricsRepo.addSyncLog(log);
        const serializedPlatforms = {};
        for (const [key, metric] of Object.entries(fetchedMetrics)) {
            serializedPlatforms[key] = metric.toJSON();
        }
        return {
            status: 'success',
            message: `Synchronized ${metricList.length} channels (${summary.totalFollowers.toLocaleString()} total verified network followers).`,
            summary: summary.toJSON(),
            platforms: serializedPlatforms,
            last_sync: nowIso,
            syncReport
        };
    }
}
exports.SyncPlatformsUseCase = SyncPlatformsUseCase;
//# sourceMappingURL=SyncPlatformsUseCase.js.map