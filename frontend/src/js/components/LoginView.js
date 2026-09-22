import { state } from '../state/dashboardState.js';
import { ApiClient } from '../api/apiClient.js';
import { ViewRouter } from '../router/viewRouter.js';

export class LoginView {
  constructor() {
    this.container = document.getElementById('viewLogin');
    this.init();

    state.subscribe((eventType, data) => {
      if (eventType === 'VIEW_CHANGED' && data.view === 'login') {
        this.render();
      }
    });
  }

  init() {
    if (!this.container) return;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="authentication-wrapper authentication-basic container-p-y d-flex align-items-center justify-content-center" style="min-height: 80vh;">
        <div class="authentication-inner" style="max-width: 440px; width: 100%;">
          <div class="card px-sm-6 px-0 shadow-sm border">
            <div class="card-body">
              <!-- Logo & Brand Header -->
              <div class="app-brand justify-content-center mb-4 text-center">
                <img src="/assets/epa_logo.png" alt="EPA Punjab Seal" style="height: 64px;" class="mb-2">
                <h4 class="mb-0 fw-bold text-heading">EPA Punjab</h4>
                <small class="text-muted d-block">Environment Protection Agency · Government of the Punjab</small>
              </div>
              
              <div class="text-center mb-4">
                <h5 class="mb-1 fw-semibold text-heading">Executive Operations Sign In 🔒</h5>
                <p class="text-muted small mb-0">Access to daily executive intelligence, analytics, and platform controls requires authentication.</p>
              </div>

              <div id="appLoginErrorAlert" class="alert alert-danger py-2 mb-4" style="display: none;" role="alert"></div>

              <form id="appLoginForm" class="mb-3">
                <div class="mb-3">
                  <label for="appLoginUsername" class="form-label">Username</label>
                  <div class="input-group input-group-merge">
                    <span class="input-group-text"><i class="bx bx-user"></i></span>
                    <input type="text" id="appLoginUsername" class="form-control" placeholder="Enter username (e.g. executive or admin)" required autocomplete="username" autofocus>
                  </div>
                </div>

                <div class="mb-3 form-password-toggle">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="form-label mb-0" for="appLoginPassword">Password</label>
                  </div>
                  <div class="input-group input-group-merge">
                    <span class="input-group-text"><i class="bx bx-key"></i></span>
                    <input type="password" id="appLoginPassword" class="form-control" placeholder="••••••••••••" required autocomplete="current-password">
                  </div>
                </div>

                <div class="mb-4">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="appRememberMe" checked>
                    <label class="form-check-label small" for="appRememberMe">Remember this session</label>
                  </div>
                </div>

                <button class="btn btn-primary d-grid w-100 py-2" type="submit" id="btnSubmitAppLogin">
                  <span class="fw-medium">Sign In to Operations Dashboard</span>
                </button>
              </form>

              <div class="text-center mt-3 pt-2 border-top">
                <small class="text-muted">Single-Organization Internal Portal · Authorized Personnel Only</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('appLoginForm');
    const errAlert = document.getElementById('appLoginErrorAlert');
    const btn = document.getElementById('btnSubmitAppLogin');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!errAlert || !btn) return;
      errAlert.style.display = 'none';

      const usernameInput = document.getElementById('appLoginUsername');
      const passwordInput = document.getElementById('appLoginPassword');
      const rememberInput = document.getElementById('appRememberMe');

      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const remember = rememberInput ? rememberInput.checked : true;

      try {
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Authenticating...';
        btn.disabled = true;

        const res = await ApiClient.login(username, password);
        ApiClient.setToken(res.token, remember);
        state.setCurrentUser(res.user);

        // Load initial metrics for the authenticated session
        try {
          const metrics = await ApiClient.getMetrics({ period: state.currentPeriod || '28d' });
          state.setMetricsData(metrics);
        } catch (loadErr) {
          console.error('[AUTH] Error loading post-login metrics:', loadErr);
        }

        ViewRouter.navigate('#dashboard');
      } catch (err) {
        errAlert.textContent = err.message || 'Invalid username or password.';
        errAlert.style.display = 'block';
        btn.innerHTML = '<span class="fw-medium">Sign In to Operations Dashboard</span>';
        btn.disabled = false;
      }
    });
  }
}
