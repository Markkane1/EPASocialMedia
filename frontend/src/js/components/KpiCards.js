import { state } from '../state/dashboardState.js';
import { formatNumber, formatCompact } from '../utils/formatters.js';
import { animateCounter } from '../utils/animations.js';

export class KpiCardsComponent {
  constructor() {
    this.totalFollowersEl = document.getElementById('kpiTotalFollowers');
    this.watchTimeEl      = document.getElementById('kpiWatchTime');
    this.newFollowersEl   = document.getElementById('kpiNewFollowers');
    this.contentViewsEl   = document.getElementById('kpiContentViews');
    this.engagementEl     = document.getElementById('kpiEngagement');
    this.briefingPeriodEl = document.getElementById('briefingPeriodNote');
    this.briefingTotalEl  = document.getElementById('briefingTotalFollowers');

    state.subscribe((eventType, data) => {
      if (eventType === 'METRICS_UPDATED' && data?.summary) {
        this.render(data.summary, data.dateRange, data.platforms);
      }
    });
  }

  /** Animate el and stamp data-counter for scroll-reveal re-triggers */
  _animate(el, value, duration, formatter = formatNumber) {
    if (!el || value == null) return;
    el.setAttribute('data-counter', String(value));
    el.setAttribute('data-counter-duration', String(duration));
    // Row 1 is always visible — animate immediately
    animateCounter(el, value, duration, formatter);
  }

  render(summary, dateRange, platforms) {
    if (!summary) return;

    // Use total impressions for the Content Views / Total impressions card as requested
    let impressionsCount = summary.total_impressions ?? summary.impressions;
    if (impressionsCount == null && platforms) {
      impressionsCount = Object.values(platforms).reduce((acc, p) => acc + (p.impressions ?? p.content_views ?? p.views ?? 0), 0);
    }
    if (impressionsCount == null) {
      impressionsCount = summary.content_views;
    }

    this._animate(this.totalFollowersEl, summary.total_followers, 1400, formatNumber);
    this._animate(this.contentViewsEl,   impressionsCount,        1600, formatNumber);
    this._animate(this.engagementEl,     summary.engagement,      1200, formatNumber);

    if (this.watchTimeEl) {
      if (summary.watch_time_hrs > 0) {
        this._animate(this.watchTimeEl, summary.watch_time_hrs, 1000, formatNumber);
      } else {
        this.watchTimeEl.textContent = '—';
      }
    }

    if (this.newFollowersEl) {
      this.newFollowersEl.setAttribute('data-counter', String(summary.new_followers));
      this.newFollowersEl.setAttribute('data-counter-duration', '1000');
      this.newFollowersEl.setAttribute('data-counter-prefix', '+');
      animateCounter(this.newFollowersEl, summary.new_followers, 1000, n => '+' + formatNumber(n));
    }

    // Briefing sidebar compact counter
    if (this.briefingTotalEl) {
      this._animate(this.briefingTotalEl, summary.total_followers, 1600, formatCompact);
    }

    if (this.briefingPeriodEl && dateRange) {
      this.briefingPeriodEl.textContent = dateRange.formatted || `${dateRange.days} Days Window`;
    }
  }
}
