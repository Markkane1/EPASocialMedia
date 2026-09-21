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
        this.render(data.summary, data.dateRange);
      }
    });
  }

  render(summary, dateRange) {
    if (!summary) return;

    // Animate numeric KPIs with count-up
    if (this.totalFollowersEl) {
      animateCounter(this.totalFollowersEl, summary.total_followers, 1400, formatNumber);
    }
    if (this.contentViewsEl) {
      animateCounter(this.contentViewsEl, summary.content_views, 1600, formatNumber);
    }
    if (this.engagementEl) {
      animateCounter(this.engagementEl, summary.engagement, 1200, formatNumber);
    }
    if (this.watchTimeEl) {
      if (summary.watch_time_hrs > 0) {
        animateCounter(this.watchTimeEl, summary.watch_time_hrs, 1000, formatNumber);
      } else {
        this.watchTimeEl.textContent = '—';
      }
    }
    if (this.newFollowersEl) {
      animateCounter(
        this.newFollowersEl,
        summary.new_followers,
        1000,
        (n) => '+' + formatNumber(n)
      );
    }

    // Briefing sidebar values (compact format)
    if (this.briefingTotalEl) {
      animateCounter(this.briefingTotalEl, summary.total_followers, 1600, formatCompact);
    }

    if (this.briefingPeriodEl && dateRange) {
      this.briefingPeriodEl.textContent = dateRange.formatted || `${dateRange.days} Days Window`;
    }
  }
}
