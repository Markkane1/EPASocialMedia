/**
 * Centralized State Management Store for EPA Punjab Dashboard
 */

class DashboardState {
  constructor() {
    this.currentView = 'dashboard'; // 'dashboard', 'platform', 'settings'
    this.selectedPlatform = null;
    this.currentPeriod = '28d';
    this.dateRange = {
      from: '',
      to: '',
      period: '28d',
      days: 28,
      formatted: 'Last 28 Days'
    };
    this.metricsData = null;
    this.configData = null;
    this.currentUser = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(eventType, payload) {
    this.listeners.forEach(fn => fn(eventType, payload, this));
  }

  setView(view, platformKey = null) {
    this.currentView = view;
    this.selectedPlatform = platformKey;
    this.notify('VIEW_CHANGED', { view, platformKey });
  }

  setPeriod(period) {
    this.currentPeriod = period;
    this.dateRange.period = period;
    this.notify('PERIOD_CHANGED', period);
  }

  setDateRange(from, to) {
    this.dateRange.from = from;
    this.dateRange.to = to;
    this.dateRange.period = 'custom';
    this.notify('DATE_RANGE_CHANGED', { from, to });
  }

  setMetricsData(data) {
    this.metricsData = data;
    if (data.dateRange) {
      this.dateRange = {
        ...this.dateRange,
        ...data.dateRange
      };
    }
    this.notify('METRICS_UPDATED', data);
  }

  setConfigData(config) {
    this.configData = config;
    this.notify('CONFIG_UPDATED', config);
  }

  setCurrentUser(user) {
    this.currentUser = user;
    this.notify('AUTH_CHANGED', user);
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isAdmin() {
    return this.currentUser?.role === 'ADMIN';
  }
}

export const state = new DashboardState();
