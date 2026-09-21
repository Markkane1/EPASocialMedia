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
        const rawWt = this.watchTimeHrs !== null ? this.watchTimeHrs : this.watchTime;
        const scaledWt = rawWt !== null ? Math.round(rawWt * multiplier) : null;
        const scaledEngagement = Math.round(this.engagement * multiplier);
        return new PlatformMetric({
            ...this,
            followers: scaledFollowers,
            newFollowers: scaledNewFollowers,
            views: scaledViews,
            contentViews: scaledViews,
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