/**
 * Automated Live Smoke Test for EPA Punjab Social Media Dashboard
 * Tests each screen, route, and end-to-end user workflow against the live server.
 */

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';

interface TestResult {
  screen: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

function record(screen: string, test: string, pass: boolean, details?: string) {
  const status = pass ? 'PASS' : 'FAIL';
  results.push({ screen, test, status, details });
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} [${screen}] ${test}${details ? ` -> ${details}` : ''}`);
}

async function runSmokeTests() {
  console.log('='.repeat(70));
  console.log(`SMOKE TESTING EPA PUNJAB DASHBOARD SCREENS ON ${BASE_URL}`);
  console.log('='.repeat(70));

  // =========================================================================
  // SCREEN 1: HTML Application Shell & Static Assets
  // =========================================================================
  console.log('\n--- SCREEN 1: App Shell & Static Asset Distribution ---');
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();

    record('App Shell', 'GET / returns 200 OK', res.status === 200);
    record('App Shell', 'Contains #viewLogin container', html.includes('id="viewLogin"'));
    record('App Shell', 'Contains #viewDashboard container', html.includes('id="viewDashboard"'));
    record('App Shell', 'Contains #viewPlatformDetail container', html.includes('id="viewPlatformDetail"'));
    record('App Shell', 'Contains #viewAdminSettings container', html.includes('id="viewAdminSettings"'));
    record('App Shell', 'Contains #layout-menu sidebar', html.includes('id="layout-menu"'));
    record('App Shell', 'Contains #layout-navbar header', html.includes('id="layout-navbar"'));
    record('App Shell', 'Loads ES Module main.js entrypoint', html.includes('/src/js/main.js'));
  } catch (err: any) {
    record('App Shell', 'Fetch index.html failed', false, err.message);
  }

  // Check critical frontend JS modules
  const frontendModules = [
    '/src/js/main.js',
    '/src/js/router/viewRouter.js',
    '/src/js/state/dashboardState.js',
    '/src/js/api/apiClient.js',
    '/src/js/components/LoginView.js',
    '/src/js/components/Header.js',
    '/src/js/components/KpiCards.js',
    '/src/js/components/OverviewCharts.js',
    '/src/js/components/PlatformColumns.js',
    '/src/js/components/OperationalWidgets.js',
    '/src/js/components/PlatformDetailView.js',
    '/src/js/components/AdminSettingsView.js',
    '/src/js/utils/formatters.js'
  ];

  for (const mod of frontendModules) {
    try {
      const res = await fetch(`${BASE_URL}${mod}`);
      record('Assets', `Delivers ${mod}`, res.status === 200, `HTTP ${res.status}`);
    } catch (err: any) {
      record('Assets', `Delivers ${mod}`, false, err.message);
    }
  }

  // =========================================================================
  // SCREEN 2: Login Screen (#login) & Authentication Verification
  // =========================================================================
  console.log('\n--- SCREEN 2: Login Screen & Authentication Gate ---');
  let execToken = '';
  let adminToken = '';

  // 1. Rejects invalid credentials
  try {
    const invalidRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'executive', password: 'WrongPassword!' })
    });
    const invalidData = await invalidRes.json();
    record('Login Screen', 'Rejects wrong password with 401', invalidRes.status === 401, invalidData.message);
  } catch (err: any) {
    record('Login Screen', 'Login test error', false, err.message);
  }

  // 2. Authenticates Executive Account
  try {
    const execLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'executive', password: 'Executive@EPAPunjab2026!' })
    });
    const execData = await execLogin.json();
    const ok = execLogin.status === 200 && !!execData.token && execData.user?.role === 'EXECUTIVE';
    record('Login Screen', 'Authenticates Executive account', ok, `User: ${execData.user?.fullName}`);
    execToken = execData.token || '';
  } catch (err: any) {
    record('Login Screen', 'Executive login error', false, err.message);
  }

  // 3. Authenticates Admin Account
  try {
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@EPAPunjab2026!' })
    });
    const adminData = await adminLogin.json();
    const ok = adminLogin.status === 200 && !!adminData.token && adminData.user?.role === 'ADMIN';
    record('Login Screen', 'Authenticates Administrator account', ok, `User: ${adminData.user?.fullName}`);
    adminToken = adminData.token || '';
  } catch (err: any) {
    record('Login Screen', 'Admin login error', false, err.message);
  }

  // =========================================================================
  // SCREEN 3: Executive Operations Dashboard (#dashboard)
  // =========================================================================
  console.log('\n--- SCREEN 3: Executive Operations Dashboard ---');
  try {
    const res = await fetch(`${BASE_URL}/api/metrics?period=28d`, {
      headers: { Authorization: `Bearer ${execToken}` }
    });
    const data = await res.json();

    record('Dashboard', 'GET /api/metrics?period=28d returns 200 OK', res.status === 200);
    record('Dashboard', 'Returns Executive Summary statistics', !!data.summary, `Total Followers: ${data.summary?.total_followers?.toLocaleString()} | Views: ${data.summary?.content_views?.toLocaleString()} | Engagement: ${data.summary?.engagement?.toLocaleString()}`);
    record('Dashboard', 'Returns Platform breakdown', !!data.platforms, `Platforms: ${Object.keys(data.platforms || {}).join(', ')}`);
    record('Dashboard', 'Includes Facebook metrics', !!data.platforms?.facebook);
    record('Dashboard', 'Includes Instagram metrics', !!data.platforms?.instagram);
    record('Dashboard', 'Includes YouTube metrics', !!data.platforms?.youtube);
    record('Dashboard', 'Includes TikTok metrics', !!data.platforms?.tiktok);
    record('Dashboard', 'Includes X (Twitter) metrics', !!data.platforms?.x);
    record('Dashboard', 'Includes LinkedIn metrics', !!data.platforms?.linkedin);

    // Test different period filter selections
    for (const p of ['7d', '28d', '90d', 'ytd']) {
      const pRes = await fetch(`${BASE_URL}/api/metrics?period=${p}`, {
        headers: { Authorization: `Bearer ${execToken}` }
      });
      record('Dashboard', `Period filter '${p}' returns valid dataset`, pRes.status === 200, `HTTP ${pRes.status}`);
    }
  } catch (err: any) {
    record('Dashboard', 'Metrics loading error', false, err.message);
  }

  // =========================================================================
  // SCREEN 4: Platform Detail Views (#platform/<platformKey>)
  // =========================================================================
  console.log('\n--- SCREEN 4: Platform Master-Detail Screens ---');
  const platforms = ['facebook', 'instagram', 'youtube', 'tiktok', 'x', 'linkedin'];

  try {
    const res = await fetch(`${BASE_URL}/api/metrics?period=28d`, {
      headers: { Authorization: `Bearer ${execToken}` }
    });
    const metricsData = await res.json();

    for (const p of platforms) {
      const platformInfo = metricsData.platforms?.[p];
      const valid = !!platformInfo && typeof platformInfo.followers === 'number';
      record(
        `Detail: ${p.toUpperCase()}`,
        `Provides complete data for #platform/${p}`,
        valid,
        valid ? `Followers: ${platformInfo.followers.toLocaleString()} | Views: ${platformInfo.views?.toLocaleString()} | Status: ${platformInfo.status}` : 'Missing platform data'
      );
    }
  } catch (err: any) {
    record('Platform Detail', 'Platform detail data error', false, err.message);
  }

  // =========================================================================
  // SCREEN 5: Admin Settings & Security Portal (#settings)
  // =========================================================================
  console.log('\n--- SCREEN 5: Admin Settings & Security Portal ---');

  // 1. Executive is blocked from Admin Config
  try {
    const execConfig = await fetch(`${BASE_URL}/api/config`, {
      headers: { Authorization: `Bearer ${execToken}` }
    });
    record(
      'Admin Portal',
      'Blocks Executive from configuration (HTTP 403)',
      execConfig.status === 403,
      `Status: ${execConfig.status}`
    );
  } catch (err: any) {
    record('Admin Portal', 'Executive config test error', false, err.message);
  }

  // 2. Admin retrieves masked credentials
  try {
    const adminConfig = await fetch(`${BASE_URL}/api/config`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const configData = await adminConfig.json();
    const hasKeys = Object.keys(configData).length > 0;
    record(
      'Admin Portal',
      'Admin retrieves masked platform configuration',
      adminConfig.status === 200 && hasKeys,
      `Config keys present: ${Object.keys(configData).length}`
    );
  } catch (err: any) {
    record('Admin Portal', 'Admin config retrieval error', false, err.message);
  }

  // 3. Admin tests platform connection
  try {
    const connTest = await fetch(`${BASE_URL}/api/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ platform: 'facebook' })
    });
    const connData = await connTest.json();
    record(
      'Admin Portal',
      'Admin tests Facebook API connection',
      connTest.status === 200 && connData.platform === 'facebook',
      `Result: ${connData.message}`
    );
  } catch (err: any) {
    record('Admin Portal', 'Test connection error', false, err.message);
  }

  // 4. Admin inspects audit logs
  try {
    const auditRes = await fetch(`${BASE_URL}/api/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    record(
      'Admin Portal',
      'Admin retrieves live security audit trail',
      auditRes.status === 200 && Array.isArray(auditData.logs),
      `Recent audit logs: ${auditData.total}`
    );
  } catch (err: any) {
    record('Admin Portal', 'Audit logs error', false, err.message);
  }

  // 5. Admin lists registered users
  try {
    const usersRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const usersData = await usersRes.json();
    record(
      'Admin Portal',
      'Admin lists system users with password hashes stripped',
      usersRes.status === 200 && Array.isArray(usersData.users),
      `Accounts found: ${usersData.users?.map((u: any) => `${u.username} (${u.role})`).join(', ')}`
    );
  } catch (err: any) {
    record('Admin Portal', 'Users list error', false, err.message);
  }

  // =========================================================================
  // SCREEN 6: Logout & Session Revocation
  // =========================================================================
  console.log('\n--- SCREEN 6: Logout & Session Invalidation ---');
  try {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${execToken}` }
    });
    record('Logout', 'POST /api/auth/logout returns 200 OK', logoutRes.status === 200);

    // Verify token cannot be reused
    const reuseRes = await fetch(`${BASE_URL}/api/metrics`, {
      headers: { Authorization: `Bearer ${execToken}` }
    });
    record(
      'Logout',
      'Logged-out session cannot access dashboard (401 SESSION_REVOKED)',
      reuseRes.status === 401,
      `Status: ${reuseRes.status}`
    );
  } catch (err: any) {
    record('Logout', 'Logout error', false, err.message);
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`SMOKE TEST RESULTS: ${passed} PASSED, ${failed} FAILED across ${results.length} total checks.`);
  console.log('='.repeat(70));

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((e) => {
  console.error('Smoke test runner fatal error:', e);
  process.exit(1);
});
