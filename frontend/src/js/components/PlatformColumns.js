import { state } from '../state/dashboardState.js';
import { formatNumber } from '../utils/formatters.js';
import { ViewRouter } from '../router/viewRouter.js';

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
        if (platformKey) {
          ViewRouter.navigate('#platform/' + platformKey);
        }
      });
    });
  }

  render(platforms) {
    if (!platforms) return;

    this.columns.forEach(col => {
      const pKey = col.dataset.platform;
      const data = platforms[pKey];
      if (!data) return;

      // Update followers count
      const followersEl = col.querySelector('.col-followers-count');
      if (followersEl) {
        followersEl.textContent = data.status === 'unconfigured' ? '—' : formatNumber(data.followers);
      }

      // Update watch time
      const wtRow = col.querySelector('.metric-row[data-metric="watch_time"] .metric-val');
      if (wtRow) {
        const wtVal = data.watch_time_hrs !== null ? data.watch_time_hrs : data.watch_time;
        wtRow.textContent = (wtVal !== null && wtVal !== undefined && data.status !== 'unconfigured') ? formatNumber(wtVal) : '—';
      }

      // Update new followers
      const nfRow = col.querySelector('.metric-row[data-metric="new_followers"] .metric-val');
      if (nfRow) {
        nfRow.textContent = data.status === 'unconfigured' ? '—' : ('+' + formatNumber(data.new_followers));
      }

      // Update content views
      const viewsRow = col.querySelector('.metric-row[data-metric="views"] .metric-val');
      if (viewsRow) {
        viewsRow.textContent = data.status === 'unconfigured' ? '—' : formatNumber(data.views || data.content_views);
      }

      // Update engagement
      const engRow = col.querySelector('.metric-row[data-metric="engagement"] .metric-val');
      if (engRow) {
        engRow.textContent = data.status === 'unconfigured' ? '—' : formatNumber(data.engagement);
      }

      // Update connection status badge
      const statusBadge = col.querySelector('.status-dot');
      if (statusBadge) {
        statusBadge.className = `status-dot ${data.status || 'connected'}`;
      }
    });
  }
}
