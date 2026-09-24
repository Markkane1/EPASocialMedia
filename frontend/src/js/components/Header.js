import { state } from '../state/dashboardState.js';
import { ApiClient } from '../api/apiClient.js';
import { ViewRouter } from '../router/viewRouter.js';
import { escapeHtml } from '../utils/formatters.js';

export class HeaderComponent {
  constructor() {
    this.reportingPeriodLabel = document.getElementById('reportingPeriodLabel');
    this.sectionTitleEl = document.getElementById('sectionInsightsTitle');
    this.syncBtn = document.getElementById('syncDataBtn');
    this.syncBtnText = document.getElementById('syncBtnText');
    this.presetButtons = document.querySelectorAll('.preset-btn');
    this.printReportBtn = document.getElementById('printReportBtn');
    this.adminPortalBtn = document.getElementById('adminPortalBtn');
    this.adminPortalBtnText = document.getElementById('adminPortalBtnText');
    this.navUserNameEl = document.getElementById('navUserName');
    this.navUserRoleEl = document.getElementById('navUserRole');

    this.inputDateFrom = document.getElementById('filterDateFrom');
    this.inputDateTo = document.getElementById('filterDateTo');
    this.btnApplyDate = document.getElementById('btnApplyDate');

    this.initDateInputs();
    this.bindEvents();
    this.updateAuthBadge();

    state.subscribe((eventType, data) => {
      if (eventType === 'METRICS_UPDATED') {
        this.updatePeriodDisplay(data.dateRange);
        const p = data.period || state.currentPeriod;
        if (p) {
          this.presetButtons.forEach(b => {
            b.classList.toggle('active', b.dataset.period === p);
          });
        }
      } else if (eventType === 'PERIOD_CHANGED') {
        this.presetButtons.forEach(b => {
          b.classList.toggle('active', b.dataset.period === data);
        });
      } else if (eventType === 'AUTH_CHANGED') {
        this.updateAuthBadge();
      } else if (eventType === 'VIEW_CHANGED') {
        this.updateActiveMenuItem(data.view, data.platformKey);
      }
    });
  }

  initDateInputs() {
    const today = new Date();
    const past28 = new Date(today.getTime() - 27 * 24 * 60 * 60 * 1000);

    const toStr = today.toISOString().split('T')[0];
    const fromStr = past28.toISOString().split('T')[0];

    if (this.inputDateTo && !this.inputDateTo.value) {
      this.inputDateTo.value = toStr;
      this.inputDateTo.max = toStr;
    }
    if (this.inputDateFrom && !this.inputDateFrom.value) {
      this.inputDateFrom.value = fromStr;
      this.inputDateFrom.max = toStr;
    }
  }

  bindEvents() {
    // Preset Buttons (7d, 28d, 90d, ytd)
    this.presetButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const period = btn.dataset.period;
        this.presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        state.setPeriod(period);
        await this.loadMetrics({ period });
      });
    });

    // Custom Date Range Apply Button
    if (this.btnApplyDate) {
      this.btnApplyDate.addEventListener('click', async () => {
        const from = this.inputDateFrom?.value;
        const to = this.inputDateTo?.value;

        if (!from || !to) {
          alert('Please select both From and To dates.');
          return;
        }

        if (new Date(from) > new Date(to)) {
          alert('From date cannot be after To date.');
          return;
        }

        this.presetButtons.forEach(b => b.classList.remove('active'));
        state.setDateRange(from, to);
        await this.loadMetrics({ from, to });
      });
    }

    // Sync Live Data Button
    if (this.syncBtn) {
      this.syncBtn.addEventListener('click', async () => {
        await this.handleSync();
      });
    }

    // Admin Portal Navigation
    if (this.adminPortalBtn) {
      this.adminPortalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        ViewRouter.navigate('#settings');
      });
    }

    // Export / Print PDF
    if (this.printReportBtn) {
      this.printReportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
      });
    }

    // Sidebar navigation bindings
    document.querySelectorAll('.menu-link[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        if (route) ViewRouter.navigate(route);
      });
    });
  }

  updateActiveMenuItem(view, platformKey) {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

    if (view === 'dashboard') {
      const el = document.getElementById('menuItemOverview');
      if (el) el.classList.add('active');
    } else if (view === 'platform') {
      const el = document.getElementById(`menuItem_${platformKey}`);
      if (el) el.classList.add('active');
    } else if (view === 'settings') {
      const targetId = platformKey === 'users' ? 'menuItemUsers' : 'menuItemSettings';
      const el = document.getElementById(targetId);
      if (el) el.classList.add('active');
    }
  }

  async loadMetrics(options) {
    try {
      if (this.syncBtnText) this.syncBtnText.textContent = 'Updating...';
      const data = await ApiClient.getMetrics(options);
      state.setMetricsData(data);
    } catch (err) {
      console.error('Error filtering metrics:', err);
    } finally {
      if (this.syncBtnText) this.syncBtnText.textContent = 'Sync';
    }
  }

  updatePeriodDisplay(range) {
    if (!range) return;

    if (this.reportingPeriodLabel) {
      this.reportingPeriodLabel.textContent = `Reporting: ${range.formatted}`;
    }

    if (this.sectionTitleEl) {
      this.sectionTitleEl.textContent = `Social Media Insights — ${range.from} to ${range.to} (${range.days} Days)`;
    }

    const heroPeriodEl = document.getElementById('heroPeriodTag');
    if (heroPeriodEl) {
      heroPeriodEl.textContent = range.formatted;
    }

    if (this.inputDateFrom && range.from) this.inputDateFrom.value = range.from;
    if (this.inputDateTo && range.to) this.inputDateTo.value = range.to;
  }

  updateAuthBadge() {
    const user = state.currentUser;
    const isAdmin = state.isAdmin();

    // Toggle administrative navigation visibility based on role (Hides Security & Settings for executive)
    const adminNavItems = document.querySelectorAll('.admin-nav-item');
    adminNavItems.forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });

    if (isAdmin) {
      if (this.adminPortalBtnText) this.adminPortalBtnText.textContent = 'Admin (Active)';
      if (this.navUserNameEl) this.navUserNameEl.textContent = user?.fullName || 'Administrator';
      if (this.navUserRoleEl) this.navUserRoleEl.textContent = 'EPA Administrator';
    } else {
      if (this.adminPortalBtnText) this.adminPortalBtnText.textContent = 'Admin 🔒';
      if (this.navUserNameEl) this.navUserNameEl.textContent = user?.fullName || 'Executive Officer';
      if (this.navUserRoleEl) this.navUserRoleEl.textContent = 'EPA Executive';
    }
  }

  async handleSync() {
    if (!this.syncBtn) return;
    const origText = this.syncBtnText?.textContent || 'Sync';
    if (this.syncBtnText) this.syncBtnText.textContent = 'Syncing...';
    this.syncBtn.classList.add('disabled');

    try {
      const res = await ApiClient.syncAll();
      state.setMetricsData(res);

      // Sneat Toast or Alert
      const reportItems = res.syncReport?.map(r => {
        const badgeClass = r.isLive ? 'bg-label-success' : (r.status === 'unconfigured' ? 'bg-label-secondary' : 'bg-label-info');
        const badgeText = r.isLive ? 'Live API Synced' : (r.status === 'unconfigured' ? 'Pending Launch' : 'Verified Public');
        return `
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-medium">${escapeHtml(r.name || r.platform.toUpperCase())}</span>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>
        `;
      }).join('') || '';

      const toast = document.createElement('div');
      toast.className = 'bs-toast toast fade show position-fixed top-0 end-0 m-4 bg-white shadow-lg';
      toast.style.zIndex = '9999';
      toast.style.minWidth = '340px';
      toast.innerHTML = `
        <div class="toast-header border-bottom">
          <i class="bx bx-check-circle text-success me-2 icon-md"></i>
          <div class="me-auto fw-semibold">Live Operational Sync</div>
          <small class="text-muted">Just now</small>
          <button type="button" class="btn-close" onclick="this.closest('.bs-toast').remove()"></button>
        </div>
        <div class="toast-body py-3">
          <div class="mb-3">${reportItems}</div>
          <small class="text-muted d-block">All metrics synchronized directly with official live accounts.</small>
        </div>
      `;

      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 6000);
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Sync failed. Check console for details.');
    } finally {
      if (this.syncBtnText) this.syncBtnText.textContent = origText;
      this.syncBtn.classList.remove('disabled');
    }
  }
}
