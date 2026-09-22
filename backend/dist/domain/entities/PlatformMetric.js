"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformMetric = void 0;
class PlatformMetric {
    platform;
    name;
    followers;
    watchTime;
    watchTimeHrs;
    newFollowers;
    views;
    contentViews;
    impressions;
    viewers;
    reach;
    linkClicks;
    visits;
    growth;
    historicalTrends;
    engagement;
    status;
    isFallback;
    handle;
    url;
    lastUpdated;
    constructor(props) {
        this.platform = props.platform;
        this.name = props.name;
        this.followers = Math.max(0, props.followers);
        this.watchTime = props.watchTime;
        this.watchTimeHrs = props.watchTimeHrs;
        this.newFollowers = Math.max(0, props.newFollowers);
        this.views = Math.max(0, props.views);
        this.contentViews = Math.max(0, props.contentViews || props.views);
        this.impressions = Math.max(0, props.impressions ?? (props.contentViews || props.views));
        this.viewers = Math.max(0, props.viewers ?? Math.round(this.views * 0.3));
        this.reach = Math.max(0, props.reach ?? this.viewers);
        this.linkClicks = Math.max(0, props.linkClicks ?? 0);
        this.visits = Math.max(0, props.visits ?? 0);
        this.growth = props.growth || {};
        this.historicalTrends = props.historicalTrends || [];
        this.engagement = Math.max(0, props.engagement);
        this.status = props.status;
        this.isFallback = props.isFallback;
        this.handle = props.handle;
        this.url = props.url;
        this.lastUpdated = props.lastUpdated || new Date().toISOString();
    }
    /**
     * Scales flow metrics based on reporting period multiplier.
     */
    scaleForPeriod(multiplier, is7d = false) {
        let scaledFollowers = this.followers;
        let scaledNewFollowers = this.newFollowers;
        if (is7d) {
            scaledNewFollowers = Math.round(this.newFollowers * 0.25);
            scaledFollowers = Math.max(0, this.followers - Math.round(this.newFollowers * 0.75));
        }
        else if (multiplier !== 1.0) {
            scaledNewFollowers = Math.round(this.newFollowers * multiplier);
        }
        const scaledViews = Math.round(this.views * multiplier);
        const scaledImpressions = Math.round(this.impressions * multiplier);
        const scaledViewers = Math.round(this.viewers * multiplier);
        const scaledReach = Math.round(this.reach * multiplier);
        const scaledLinkClicks = Math.round(this.linkClicks * multiplier);
        const scaledVisits = Math.round(this.visits * multiplier);
        const rawWt = this.watchTimeHrs !== null ? this.watchTimeHrs : this.watchTime;
        const scaledWt = rawWt !== null ? Math.round(rawWt * multiplier) : null;
        const scaledEngagement = Math.round(this.engagement * multiplier);
        return new PlatformMetric({
            ...this,
            followers: scaledFollowers,
            newFollowers: scaledNewFollowers,
            views: scaledViews,
            contentViews: scaledViews,
            impressions: scaledImpressions,
            viewers: scaledViewers,
            reach: scaledReach,
            linkClicks: scaledLinkClicks,
            visits: scaledVisits,
            watchTime: scaledWt,
            watchTimeHrs: scaledWt,
            engagement: scaledEngagement
        });
    }
    toJSON() {
        return {
            platform: this.platform,
            name: this.name,
            followers: this.followers,
            watch_time: this.watchTime,
            watch_time_hrs: this.watchTimeHrs,
            new_followers: this.newFollowers,
            views: this.views,
            content_views: this.contentViews,
            impressions: this.impressions,
            viewers: this.viewers,
            reach: this.reach,
            link_clicks: this.linkClicks,
            visits: this.visits,
            growth: this.growth,
            historical_trends: this.historicalTrends,
            engagement: this.engagement,
            status: this.status,
            is_fallback: this.isFallback,
            handle: this.handle,
            url: this.url,
            last_updated: this.lastUpdated
        };
    }
}
exports.PlatformMetric = PlatformMetric;
//# sourceMappingURL=PlatformMetric.js.map