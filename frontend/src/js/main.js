import { ApiClient } from './api/apiClient.js';
import { state } from './state/dashboardState.js';
import { HeaderComponent } from './components/Header.js';
import { KpiCardsComponent } from './components/KpiCards.js';
import { OverviewChartsComponent } from './components/OverviewCharts.js';
import { PlatformColumnsComponent } from './components/PlatformColumns.js';
import { OperationalWidgetsComponent } from './components/OperationalWidgets.js';
import { PlatformDetailView } from './components/PlatformDetailView.js';
import { AdminSettingsView } from './components/AdminSettingsView.js';
import { LoginView } from './components/LoginView.js';
import { ViewRouter } from './router/viewRouter.js';
import {
  initScrollReveal,
  initRippleEffect,
  initLivePulse,
  animateProgressBars,
  updateAdminButtonState
} from './utils/animations.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[DASHBOARD] Initializing EPA Punjab Sneat 360° Operations Dashboard...');

  // Initialize UI Views & Components
  const header             = new HeaderComponent();
  const kpiCards           = new KpiCardsComponent();
  const overviewCharts     = new OverviewChartsComponent();
  const platformColumns    = new PlatformColumnsComponent();
  const operationalWidgets = new OperationalWidgetsComponent();
  const platformDetailView = new PlatformDetailView();
  const adminSettingsView  = new AdminSettingsView();
  const loginView          = new LoginView();
  const router             = new ViewRouter();

  // View containers & layout elements
  const viewLogin          = document.getElementById('viewLogin');
  const viewDashboard      = document.getElementById('viewDashboard');
  const viewPlatformDetail = document.getElementById('viewPlatformDetail');
  const viewAdminSettings  = document.getElementById('viewAdminSettings');
  const layoutMenu         = document.getElementById('layout-menu');
  const layoutNavbar       = document.getElementById('layout-navbar');
  const appLogoutBtn       = document.getElementById('appLogoutBtn');

  appLogoutBtn?.addEventListener('click', async () => {
    await ApiClient.logout();
    state.setCurrentUser(null);
    state.setView('login');
  });

  function updateViewVisibility(view) {
    if (view === 'login') {
      if (viewLogin)          viewLogin.style.display          = 'block';
      if (viewDashboard)      viewDashboard.style.display      = 'none';
      if (viewPlatformDetail) viewPlatformDetail.style.display = 'none';
      if (viewAdminSettings)  viewAdminSettings.style.display  = 'none';
      if (layoutMenu)         layoutMenu.style.display         = 'none';
      if (layoutNavbar)       layoutNavbar.style.display       = 'none';
      loginView.render();
      return;
    }

    if (layoutMenu)         layoutMenu.style.display         = '';
    if (layoutNavbar)       layoutNavbar.style.display       = '';
    if (viewLogin)          viewLogin.style.display          = 'none';
    if (viewDashboard)      viewDashboard.style.display      = view === 'dashboard' ? 'block' : 'none';
    if (viewPlatformDetail) viewPlatformDetail.style.display = view === 'platform'  ? 'block' : 'none';
    if (viewAdminSettings)  viewAdminSettings.style.display  = view === 'settings'  ? 'block' : 'none';

    // Hard reset scroll position — no leftward drift
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;

    // Re-trigger entrance animations when returning to dashboard
    if (view === 'dashboard') {
      setTimeout(() => {
        initScrollReveal();
        initLivePulse();
      }, 60);

      if (state.metricsData) {
        setTimeout(() => {
          overviewCharts.render(state.metricsData);
          operationalWidgets.render(state.metricsData);
        }, 120);
      }
    }
  }

  state.subscribe((eventType, data) => {
    if (eventType === 'VIEW_CHANGED') {
      updateViewVisibility(data.view);
    } else if (eventType === 'METRICS_UPDATED') {
      overviewCharts.render(data);
      operationalWidgets.render(data);
    } else if (eventType === 'AUTH_CHANGED') {
      updateAdminButtonState(state.isAdmin());
      if (!state.isAuthenticated()) {
        updateViewVisibility('login');
      }
    }
  });

  // Verify existing auth session
  try {
    const me = await ApiClient.getMe();
    if (me && me.user) {
      state.setCurrentUser(me.user);
      updateAdminButtonState(state.isAdmin());

      // Authenticated initial data load
      try {
        const data = await ApiClient.getMetrics({ period: '28d' });
        state.setMetricsData(data);
      } catch (metricsErr) {
        console.error('[DASHBOARD] Error loading initial metrics:', metricsErr);
      }
    } else {
      ApiClient.clearToken();
      state.setCurrentUser(null);
    }
  } catch {
    ApiClient.clearToken();
    state.setCurrentUser(null);
  }

  // Initialize router (triggers initial view based on auth state)
  router.init();

  // Boot animation passes — slight delay so DOM is ready
  requestAnimationFrame(() => {
    initScrollReveal();
    initRippleEffect();
    initLivePulse();
    animateProgressBars();
    updateAdminButtonState(state.isAdmin());
  });

  console.log('[DASHBOARD] 360° Executive Dashboard operational with full animation pass.');
});
