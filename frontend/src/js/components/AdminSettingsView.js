import { state } from '../state/dashboardState.js';
import { ApiClient } from '../api/apiClient.js';
import { ViewRouter } from '../router/viewRouter.js';

export class AdminSettingsView {
  constructor() {
    this.container = document.getElementById('viewAdminSettings');
    this.init();

    state.subscribe((eventType, data) => {
      if (eventType === 'VIEW_CHANGED' && data.view === 'settings') {
        this.render();
      } else if (eventType === 'AUTH_CHANGED' && state.currentView === 'settings') {
        this.render();
      }
    });
  }

  init() {
    if (!this.container) return;
  }

  render() {
    if (!this.container) return;

    if (!state.isAdmin()) {
      this.renderLoginGate();
    } else {
      this.renderSettingsPanel();
    }
  }

  renderLoginGate() {
    this.container.innerHTML = `
      <div class="authentication-wrapper authentication-basic container-p-y d-flex align-items-center justify-content-center" style="min-height: 70vh;">
        <div class="authentication-inner" style="max-width: 440px; width: 100%;">
          <div class="card px-sm-6 px-0 shadow-sm">
            <div class="card-body">
              <!-- Logo -->
              <div class="app-brand justify-content-center mb-4 text-center">
                <img src="/assets/epa_logo.png" alt="EPA Punjab" style="height: 54px;" class="mb-2">
                <h4 class="mb-0 fw-bold text-heading">EPA Punjab</h4>
                <small class="text-muted d-block">Environment Protection Agency</small>
              </div>
              
              <div class="text-center mb-4">
                <h5 class="mb-1 fw-semibold text-heading">Administrator Security Gate 🔒</h5>
                <p class="text-muted small mb-0">Direct platform API credentials and synchronization settings are restricted to authorized administrators.</p>
              </div>

              <div id="loginErrorAlert" class="alert alert-danger py-2 mb-4" style="display: none;" role="alert"></div>

              <form id="adminLoginForm" class="mb-4">
                <div class="mb-4">
                  <label for="loginUsername" class="form-label">Admin Username</label>
                  <div class="input-group input-group-merge">
                    <span class="input-group-text"><i class="bx bx-user"></i></span>
                    <input type="text" id="loginUsername" class="form-control" placeholder="Enter username (e.g. admin)" required autocomplete="username">
                  </div>
                </div>

                <div class="mb-4 form-password-toggle">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="form-label mb-0" for="loginPassword">Password</label>
                  </div>
                  <div class="input-group input-group-merge">
                    <span class="input-group-text"><i class="bx bx-key"></i></span>
                    <input type="password" id="loginPassword" class="form-control" placeholder="••••••••••••" required autocomplete="current-password">
                  </div>
                </div>

                <div class="mb-4">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="remember-me" checked>
                    <label class="form-check-label small" for="remember-me">Remember this session</label>
                  </div>
                </div>

                <button class="btn btn-primary d-grid w-100 py-2" type="submit" id="btnSubmitLogin">
                  <span class="fw-medium">Sign In to Admin Portal</span>
                </button>
              </form>

              <div class="text-center">
                <a href="#dashboard" class="text-secondary small d-inline-flex align-items-center" id="btnLoginBack">
                  <i class="bx bx-chevron-left me-1"></i> Return to 360° Overview
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('adminLoginForm');
    const errAlert = document.getElementById('loginErrorAlert');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errAlert.style.display = 'none';
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const btn = document.getElementById('btnSubmitLogin');
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Verifying...';
        btn.disabled = true;

        const res = await ApiClient.login(username, password);
        state.setCurrentUser(res.user);

        if (res.user.role !== 'ADMIN') {
          ApiClient.clearToken();
          state.setCurrentUser(null);
          errAlert.textContent = 'Access Denied: Your account does not have Administrator privileges.';
          errAlert.style.display = 'block';
          btn.innerHTML = '<span class="fw-medium">Sign In to Admin Portal</span>';
          btn.disabled = false;
          return;
        }

        this.render();
      } catch (err) {
        errAlert.textContent = err.message || 'Invalid username or password.';
        errAlert.style.display = 'block';
        const btn = document.getElementById('btnSubmitLogin');
        btn.innerHTML = '<span class="fw-medium">Sign In to Admin Portal</span>';
        btn.disabled = false;
      }
    });

    document.getElementById('btnLoginBack')?.addEventListener('click', (e) => {
      e.preventDefault();
      ViewRouter.navigate('#dashboard');
    });
  }

  async renderSettingsPanel() {
    this.container.innerHTML = `
      <div class="admin-settings-sneat">
        <!-- Top Breadcrumb & User Bar -->
        <div class="d-flex align-items-center justify-content-between mb-4">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb breadcrumb-style1 mb-0">
              <li class="breadcrumb-item">
                <a href="#dashboard" class="text-secondary"><i class="bx bx-home-alt me-1"></i> 360° Overview</a>
              </li>
              <li class="breadcrumb-item active text-primary fw-medium">Admin Portal & API Settings</li>
            </ol>
          </nav>

          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-outline-secondary btn-sm" id="btnSettingsBack">
              <i class="bx bx-left-arrow-alt me-1"></i> Back to 360° Overview
            </button>
            <span class="badge bg-label-primary px-3 py-2 admin-badge">ADMINISTRATOR</span>
            <button class="btn btn-outline-danger btn-sm" id="btnLogout">
              <i class="bx bx-power-off me-1"></i> Sign Out
            </button>
          </div>
        </div>

        <!-- Header Card -->
        <div class="card mb-4 settings-header-card">
          <div class="card-body py-3 d-flex align-items-center justify-content-between">
            <div>
              <h5 class="mb-0 text-heading">Platform API Credentials & Integration Hub</h5>
              <small class="text-muted">Manage server-to-server OAuth tokens and direct API access keys for EPA Punjab social channels.</small>
            </div>
          </div>
        </div>

        <!-- Feedback Alert -->
        <div id="settingsFeedbackAlert" class="alert alert-success alert-dismissible mb-4" style="display: none;" role="alert">
          <span id="settingsFeedbackText"></span>
        </div>

        <!-- API Settings Cards Grid -->
        <div class="row">
          <!-- Card 1: Meta Graph API (Facebook & Instagram) -->
          <div class="col-12 col-xl-6 mb-4">
            <div class="card h-100">
              <div class="card-header d-flex align-items-center justify-content-between pb-3">
                <div class="d-flex align-items-center gap-2">
                  <span class="avatar avatar-sm flex-shrink-0">
                    <span class="avatar-initial rounded bg-label-primary"><i class="bx bxl-meta"></i></span>
                  </span>
                  <div>
                    <h5 class="mb-0 text-heading">Meta Graph API</h5>
                    <small class="text-muted">Facebook Page & Instagram Business Account</small>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-primary test-conn-btn" data-platform="facebook">Test FB</button>
                  <button class="btn btn-sm btn-outline-info test-conn-btn" data-platform="instagram">Test IG</button>
                </div>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label" for="cfg_FB_PAGE_ID">Facebook Page ID / Handle</label>
                  <input class="form-control" type="text" id="cfg_FB_PAGE_ID" name="FB_PAGE_ID" placeholder="EnvironmentProtectionAgencyPunjab">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="cfg_FB_ACCESS_TOKEN">Meta Page Access Token</label>
                  <input class="form-control font-monospace" type="password" id="cfg_FB_ACCESS_TOKEN" name="FB_ACCESS_TOKEN" placeholder="EAAX... (Long-lived Page Token)">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="cfg_IG_USER_ID">Instagram Account ID / Handle</label>
                  <input class="form-control" type="text" id="cfg_IG_USER_ID" name="IG_USER_ID" placeholder="epapunjablive">
                </div>
                <div>
                  <label class="form-label" for="cfg_IG_ACCESS_TOKEN">Instagram Graph Access Token</label>
                  <input class="form-control font-monospace" type="password" id="cfg_IG_ACCESS_TOKEN" name="IG_ACCESS_TOKEN" placeholder="IGQV... (Instagram Access Token)">
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2: X (Twitter) API v2 -->
          <div class="col-12 col-xl-6 mb-4">
            <div class="card h-100">
              <div class="card-header d-flex align-items-center justify-content-between pb-3">
                <div class="d-flex align-items-center gap-2">
                  <span class="avatar avatar-sm flex-shrink-0">
                    <span class="avatar-initial rounded bg-label-dark"><i class="bx bxl-twitter"></i></span>
                  </span>
                  <div>
                    <h5 class="mb-0 text-heading">X (Twitter) API v2</h5>
                    <small class="text-muted">Official EPA Punjab X Account</small>
                  </div>
                </div>
                <button class="btn btn-sm btn-outline-dark test-conn-btn" data-platform="x">Test X API</button>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label" for="cfg_X_USERNAME">X Handle</label>
                  <input class="form-control" type="text" id="cfg_X_USERNAME" name="X_USERNAME" placeholder="@epapunjab">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="cfg_X_BEARER_TOKEN">X API Bearer Token</label>
                  <input class="form-control font-monospace" type="password" id="cfg_X_BEARER_TOKEN" name="X_BEARER_TOKEN" placeholder="AAAAAAAAAAAAA...">
                </div>
                <div class="alert alert-info py-2 small mb-0">
                  <i class="bx bx-info-circle me-1"></i> Public scraper fallback automatically tracks posts & followers when token is unconfigured.
                </div>
              </div>
            </div>
          </div>

          <!-- Card 3: LinkedIn Organization API -->
          <div class="col-12 col-xl-6 mb-4">
            <div class="card h-100">
              <div class="card-header d-flex align-items-center justify-content-between pb-3">
                <div class="d-flex align-items-center gap-2">
                  <span class="avatar avatar-sm flex-shrink-0">
                    <span class="avatar-initial rounded bg-label-info"><i class="bx bxl-linkedin"></i></span>
                  </span>
                  <div>
                    <h5 class="mb-0 text-heading">LinkedIn Organization API</h5>
                    <small class="text-muted">Community Management & Analytics</small>
                  </div>
                </div>
                <button class="btn btn-sm btn-outline-info test-conn-btn" data-platform="linkedin">Test LinkedIn</button>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label" for="cfg_LINKEDIN_VANITY_NAME">Organization Vanity Name</label>
                  <input class="form-control" type="text" id="cfg_LINKEDIN_VANITY_NAME" name="LINKEDIN_VANITY_NAME" placeholder="environment-protection-agency-punjab">
                </div>
                <div>
                  <label class="form-label" for="cfg_LINKEDIN_ACCESS_TOKEN">OAuth 2.0 Access Token</label>
                  <input class="form-control font-monospace" type="password" id="cfg_LINKEDIN_ACCESS_TOKEN" name="LINKEDIN_ACCESS_TOKEN" placeholder="AQV...">
                </div>
              </div>
            </div>
          </div>

          <!-- Card 4: TikTok & YouTube Configuration -->
          <div class="col-12 col-xl-6 mb-4">
            <div class="card h-100">
              <div class="card-header d-flex align-items-center justify-content-between pb-3">
                <div class="d-flex align-items-center gap-2">
                  <span class="avatar avatar-sm flex-shrink-0">
                    <span class="avatar-initial rounded bg-label-danger"><i class="bx bxl-youtube"></i></span>
                  </span>
                  <div>
                    <h5 class="mb-0 text-heading">TikTok & YouTube</h5>
                    <small class="text-muted">Broadcast Media Channels</small>
                  </div>
                </div>
                <button class="btn btn-sm btn-outline-danger test-conn-btn" data-platform="tiktok">Test TikTok</button>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label" for="cfg_TIKTOK_USERNAME">TikTok Handle</label>
                  <input class="form-control" type="text" id="cfg_TIKTOK_USERNAME" name="TIKTOK_USERNAME" placeholder="@epapunjab">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="cfg_TIKTOK_CLIENT_KEY">TikTok Client Key</label>
                  <input class="form-control font-monospace" type="text" id="cfg_TIKTOK_CLIENT_KEY" name="TIKTOK_CLIENT_KEY" placeholder="aw...">
                </div>
                <div>
                  <label class="form-label" for="cfg_YOUTUBE_API_KEY">YouTube Data API v3 Key</label>
                  <input class="form-control font-monospace" type="password" id="cfg_YOUTUBE_API_KEY" name="YOUTUBE_API_KEY" placeholder="AIzaSy...">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Bar Card -->
        <div class="card">
          <div class="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h6 class="mb-1 text-heading">Save & Apply Configuration</h6>
              <small class="text-muted">Updates are persisted directly to the PostgreSQL database with immediate connection verification.</small>
            </div>
            <button class="btn btn-primary px-4 py-2" id="btnSaveApiConfig">
              <i class="bx bx-save me-1"></i> Save Configuration
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnLogout')?.addEventListener('click', async () => {
      await ApiClient.logout();
      state.setCurrentUser(null);
      this.render();
    });

    document.getElementById('btnSettingsBack')?.addEventListener('click', () => {
      ViewRouter.navigate('#dashboard');
    });

    // Populate existing configs
    try {
      const config = await ApiClient.getConfig();
      if (config) {
        const sensitiveKeys = ['FB_ACCESS_TOKEN', 'IG_ACCESS_TOKEN', 'X_BEARER_TOKEN', 'LINKEDIN_ACCESS_TOKEN', 'YOUTUBE_API_KEY'];
        ['FB_PAGE_ID', 'FB_ACCESS_TOKEN', 'IG_USER_ID', 'IG_ACCESS_TOKEN', 'X_USERNAME', 'X_BEARER_TOKEN', 'LINKEDIN_VANITY_NAME', 'LINKEDIN_ACCESS_TOKEN', 'TIKTOK_USERNAME', 'TIKTOK_CLIENT_KEY', 'YOUTUBE_API_KEY'].forEach(key => {
          const input = document.getElementById(`cfg_${key}`);
          if (input && config[key] !== undefined) {
            if (sensitiveKeys.includes(key)) {
              input.value = '';
              if (config[key] && config[key].trim()) {
                input.placeholder = '•••••••• (Configured — leave blank to keep unchanged)';
              }
            } else {
              input.value = config[key];
            }
          }
        });
      }
    } catch (err) {
      console.warn('[ADMIN] Could not load configs:', err);
    }

    // Save button
    document.getElementById('btnSaveApiConfig')?.addEventListener('click', async () => {
      const saveBtn = document.getElementById('btnSaveApiConfig');
      const feedback = document.getElementById('settingsFeedbackAlert');
      const feedbackText = document.getElementById('settingsFeedbackText');

      const payload = {};
      const sensitiveKeys = ['FB_ACCESS_TOKEN', 'IG_ACCESS_TOKEN', 'X_BEARER_TOKEN', 'LINKEDIN_ACCESS_TOKEN', 'YOUTUBE_API_KEY'];
      ['FB_PAGE_ID', 'FB_ACCESS_TOKEN', 'IG_USER_ID', 'IG_ACCESS_TOKEN', 'X_USERNAME', 'X_BEARER_TOKEN', 'LINKEDIN_VANITY_NAME', 'LINKEDIN_ACCESS_TOKEN', 'TIKTOK_USERNAME', 'TIKTOK_CLIENT_KEY', 'YOUTUBE_API_KEY'].forEach(key => {
        const input = document.getElementById(`cfg_${key}`);
        if (input) {
          const val = input.value.trim();
          if (sensitiveKeys.includes(key)) {
            // Do not transmit empty or mask values to avoid destroying stored secrets
            if (val && !val.includes('•')) {
              payload[key] = val;
            }
          } else {
            payload[key] = input.value;
          }
        }
      });

      try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

        await ApiClient.updateConfig(payload);
        feedbackText.textContent = 'Configuration saved and verified successfully!';
        feedback.className = 'alert alert-success alert-dismissible mb-4';
        feedback.style.display = 'block';
      } catch (err) {
        feedbackText.textContent = 'Failed to save configuration: ' + err.message;
        feedback.className = 'alert alert-danger alert-dismissible mb-4';
        feedback.style.display = 'block';
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bx bx-save me-1"></i> Save Configuration';
      }
    });

    // Test buttons
    document.querySelectorAll('.test-conn-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const platform = e.target.dataset.platform;
        const originalText = e.target.innerHTML;
        const feedback = document.getElementById('settingsFeedbackAlert');
        const feedbackText = document.getElementById('settingsFeedbackText');

        e.target.disabled = true;
        e.target.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        try {
          const res = await ApiClient.testConnection(platform);
          feedbackText.textContent = `Connection test for ${platform.toUpperCase()}: ${res.status || 'OK'}`;
          feedback.className = 'alert alert-info alert-dismissible mb-4';
          feedback.style.display = 'block';
        } catch (err) {
          feedbackText.textContent = `Connection test failed for ${platform.toUpperCase()}: ${err.message}`;
          feedback.className = 'alert alert-warning alert-dismissible mb-4';
          feedback.style.display = 'block';
        } finally {
          e.target.disabled = false;
          e.target.innerHTML = originalText;
        }
      });
    });
  }
}
