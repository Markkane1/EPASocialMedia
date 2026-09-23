/**
 * @jest-environment jsdom
 */

describe('Client-Side Token Storage Security (Item 17, H-01)', () => {
  let ApiClient: any;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    const mod = await import('../../../frontend/src/js/api/apiClient.js');
    ApiClient = mod.ApiClient;
    ApiClient.clearToken();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores token in memory and sessionStorage without persisting in localStorage', () => {
    const testToken = 'sample_secure_session_jwt_token_123';
    ApiClient.setToken(testToken);

    expect(ApiClient.getToken()).toBe(testToken);
    expect(sessionStorage.getItem('epa_auth_token')).toBe(testToken);
    // Crucial security requirement (H-01): localStorage must remain empty
    expect(localStorage.getItem('epa_auth_token')).toBeNull();
  });

  it('purges existing localStorage tokens when setting new session token', () => {
    // Simulate legacy dirty localStorage
    localStorage.setItem('epa_auth_token', 'legacy_stale_token');
    expect(localStorage.getItem('epa_auth_token')).toBe('legacy_stale_token');

    ApiClient.setToken('new_tab_token');
    expect(localStorage.getItem('epa_auth_token')).toBeNull();
    expect(sessionStorage.getItem('epa_auth_token')).toBe('new_tab_token');
  });

  it('clearToken clears in-memory and storage tokens', () => {
    ApiClient.setToken('token_to_clear');
    expect(ApiClient.getToken()).toBe('token_to_clear');

    ApiClient.clearToken();
    expect(ApiClient.getToken()).toBe('');
    expect(sessionStorage.getItem('epa_auth_token')).toBeNull();
    expect(localStorage.getItem('epa_auth_token')).toBeNull();
  });
});
