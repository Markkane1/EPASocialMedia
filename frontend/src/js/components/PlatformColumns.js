/**
 * PlatformColumns.js
 * Decoupled animation: sets data-counter attributes on number elements.
 * Scroll reveal fires animateAllCountersIn() when the row enters view.
 * If the row is already visible when data loads, animates immediately.
 */
import { state } from '../state/dashboardState.js';
import { formatNumber } from '../utils/formatters.js';
import { ViewRouter } from '../router/viewRouter.js';
import { animateCounter } from '../utils/animations.js';

export class PlatformColumnsComponent {
  constructor() {
    this.columns = document.querySelectorAll('.platform-column');
    this.bindEvents();

    state.subscribe((eventType, data) => {
      if (eventType === 'METRICS_UPDATED' && data?.platforms) {
        this.render(data.platforms);
      }
    });
  }

  bindEvents() {
    this.columns.forEach(col => {
      col.addEventListener('click', () => {
        const platformKey = col.dataset.platform;
        if (platformKey) ViewRouter.navigate('#platform/' + platformKey);
      });
    });
  }

  /** True if the platform grid row is already scrolled into view */
  _gridInView() {
    const row = document.getElementById('sectionPlatformGrid');
    return row ? !!row.dataset.animated : false;
  }

  /**
   * Set data-counter on el so scroll reveal picks it up.
   * If row is already revealed, animate immediately.
   */
  _setCounter(el, value, duration, formatter = formatNumber) {
    if (!el || value === null || value === undefined) return;
    if (typeof value === 'string' && value === '—') {
      el.textContent = '—';
      return;
    }
    const numeric = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (isNaN(numeric)) { el.textContent = String(value); return; }

    el.setAttribute('data-counter', String(numeric));
    el.setAttribute('data-counter-duration', String(duration));
    if (formatter !== formatNumber) {
      // Store custom prefix/suffix for animateAllCountersIn
      if (String(value).startsWith('+')) el.setAttribute('data-counter-prefix', '+');
    }

    if (this._gridInView()) {
      animateCounter(el, numeric, duration, formatter);
    } else {
      // Show final value — animation fires on scroll
      el.textContent = formatter(numeric);
    }
  }

  render(platforms) {
    if (!platforms) return;
    const alreadyVisible = this._gridInView();

    this.columns.forEach(col => {
      const pKey = col.dataset.platform;
      const data = platforms[pKey];
      if (!data) return;

      const isUnconfigured = data.status === 'unconfigured';

      // Followers (big headline number)
      const followersEl = col.querySelector('.col-followers-count');
      if (followersEl) {
        if (isUnconfigured) { followersEl.textContent = '—'; }
        else { this._setCounter(followersEl, data.followers || 0, 1400, formatNumber); }
      }

      // Content Views
      const viewsEl = col.querySelector('.metric-row[data-metric="views"] .metric-val');
      if (viewsEl) {
        if (isUnconfigured) { viewsEl.textContent = '—'; }
        else { this._setCounter(viewsEl, data.views || data.content_views || 0, 1100, formatNumber); }
      }

      // Engagement
      const engEl = col.querySelector('.metric-row[data-metric="engagement"] .metric-val');
      if (engEl) {
        if (isUnconfigured) { engEl.textContent = '—'; }
        else { this._setCounter(engEl, data.engagement || 0, 1000, formatNumber); }
      }

      // Watch Time
      const wtEl = col.querySelector('.metric-row[data-metric="watch_time"] .metric-val');
      if (wtEl) {
        const wtVal = data.watch_time_hrs ?? data.watch_time ?? null;
        if (isUnconfigured || wtVal === null) { wtEl.textContent = '—'; }
        else { this._setCounter(wtEl, wtVal, 900, formatNumber); }
      }

      // New Followers (prefix "+")
      const nfEl = col.querySelector('.metric-row[data-metric="new_followers"] .metric-val');
      if (nfEl) {
        if (isUnconfigured) { nfEl.textContent = '—'; }
        else {
          const val = data.new_followers || 0;
          nfEl.setAttribute('data-counter', String(val));
          nfEl.setAttribute('data-counter-duration', '900');
          nfEl.setAttribute('data-counter-prefix', '+');
          if (alreadyVisible) {
            animateCounter(nfEl, val, 900, n => '+' + formatNumber(n));
          } else {
            nfEl.textContent = '+' + formatNumber(val);
          }
        }
      }

      // Status Badge
      const statusBadge = col.querySelector('.status-dot');
      if (statusBadge) {
        statusBadge.className = `status-dot ${data.status || 'connected'}`;
      }
    });
  }
}
