import { ApiClient } from './api/apiClient.js';
import { state } from './state/dashboardState.js';
import { HeaderComponent } from './components/Header.js';
import { KpiCardsComponent } from './components/KpiCards.js';
import { OverviewChartsComponent } from './components/OverviewCharts.js';
import { PlatformColumnsComponent } from './components/PlatformColumns.js';
import { OperationalWidgetsComponent } from './components/OperationalWidgets.js';
import { PlatformDetailView } from './components/PlatformDetailView.js';
import { AdminSettingsView } from './components/AdminSettingsView.js';
import { ViewRouter } from './router/viewRouter.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[DASHBOARD] Initializing EPA Punjab Sneat 360° Operations Dashboard...');

  // Initialize UI Views & Components
  const header = new HeaderComponent();
  const kpiCards = new KpiCardsComponent();
  const overviewCharts = new OverviewChartsComponent();
  const platformColumns = new PlatformColumnsComponent();
  const operationalWidgets = new OperationalWidgetsComponent();
  const platformDetailView = new PlatformDetailView();
  const adminSettingsView = new AdminSettingsView();
  const router = new ViewRouter();

  // View Switching Logic
  const viewDashboard = document.getElementById('viewDashboard');
  const viewPlatformDetail = document.getElementById('viewPlatformDetail');
  const viewAdminSettings = document.getElementById('viewAdminSettings');

  function updateViewVisibility(view) {
    if (viewDashboard) viewDashboard.style.display = view === 'dashboard' ? 'block' : 'none';
    if (viewPlatformDetail) viewPlatformDetail.style.display = view === 'platform' ? 'block' : 'none';
    if (viewAdminSettings) viewAdminSettings.style.display = view === 'settings' ? 'block' : 'none';

    // Scroll to top and left on navigation
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;

    // If switching back to dashboard, ensure charts are properly sized
    if (view === 'dashboard' && state.metricsData) {
      setTimeout(() => {
        overviewCharts.render(state.metricsData);
        operationalWidgets.render(state.metricsData);
      }, 100);
    }
  }

  state.subscribe((eventType, data) => {
    if (eventType === 'VIEW_CHANGED') {
      updateViewVisibility(data.view);
    } else if (eventType === 'METRICS_UPDATED') {
      overviewCharts.render(data);
      operationalWidgets.render(data);
    }
  });

  // Verify existing auth session
  try {
    const me = await ApiClient.getMe();
    if (me.user) {
      state.setCurrentUser(me.user);
    }
  } catch {
    // Session not active, viewer mode by default
    ApiClient.clearToken();
  }

  // Initial Data Load
  try {
    const data = await ApiClient.getMetrics({ period: '28d' });
    state.setMetricsData(data);
  } catch (err) {
    console.error('[DASHBOARD] Error loading initial metrics:', err);
  }

  // Initialize router
  router.init();
  console.log('[DASHBOARD] 360° Executive Dashboard operational.');
});
