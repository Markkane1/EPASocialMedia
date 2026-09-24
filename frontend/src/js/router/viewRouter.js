import { state } from '../state/dashboardState.js';

export class ViewRouter {
  constructor() {
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash || '#dashboard';

    if (!state.isAuthenticated()) {
      state.setView('login');
      return;
    }

    if (hash === '#login') {
      state.setView('dashboard');
      window.location.hash = '#dashboard';
      return;
    }

    if (hash.startsWith('#platform/')) {
      const platformKey = hash.replace('#platform/', '').trim().toLowerCase();
      state.setView('platform', platformKey);
    } else if (hash === '#settings' || hash.startsWith('#settings/')) {
      const tab = hash.includes('/users') ? 'users' : 'api-config';
      state.setView('settings', tab);
    } else {
      state.setView('dashboard');
    }
  }

  static navigate(hash) {
    if (window.location.hash === hash) {
      // Force route handling if already on same hash
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = hash;
    }
  }
}
