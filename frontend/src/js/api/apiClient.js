/**
 * Centralized API Client for EPA Punjab Social Media Dashboard
 */

const BASE_URL = window.location.origin;

export const ApiClient = {
  getToken() {
    return localStorage.getItem('epa_auth_token') || sessionStorage.getItem('epa_auth_token') || '';
  },

  setToken(token, remember = true) {
    if (remember) {
      localStorage.setItem('epa_auth_token', token);
    } else {
      sessionStorage.setItem('epa_auth_token', token);
    }
  },

  async logout() {
    try {
      const headers = this.getAuthHeaders();
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers
      });
    } catch (e) {
      console.warn('[AUTH] Server logout error, clearing local token:', e);
    } finally {
      this.clearToken();
    }
  },

  clearToken() {
    localStorage.removeItem('epa_auth_token');
    sessionStorage.removeItem('epa_auth_token');
  },

  getAuthHeaders() {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },


  async login(username, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Password update failed');
    return data;
  },


  async getMe() {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Unauthenticated');
    return await res.json();
  },

  async getMetrics(options = {}) {
    let url = `${BASE_URL}/api/metrics`;
    const params = new URLSearchParams();

    if (options.from && options.to) {
      params.append('from', options.from);
      params.append('to', options.to);
    } else if (options.period) {
      params.append('period', options.period);
    } else {
      params.append('period', '28d');
    }

    url += `?${params.toString()}`;
    const res = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    if (res.status === 401) {
      this.clearToken();
      throw new Error('UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(`Failed to load metrics: ${res.statusText}`);
    return await res.json();
  },

  async syncAll() {
    const res = await fetch(`${BASE_URL}/api/sync`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({})
    });
    if (res.status === 401) {
      this.clearToken();
      throw new Error('UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`);
    return await res.json();
  },

  async getConfig() {
    const res = await fetch(`${BASE_URL}/api/config`, {
      headers: this.getAuthHeaders()
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(`Failed to load config: ${res.statusText}`);
    return await res.json();
  },

  async updateConfig(config) {
    const res = await fetch(`${BASE_URL}/api/config`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(config)
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(`Failed to update config: ${res.statusText}`);
    return await res.json();
  },

  async testConnection(platform) {
    const res = await fetch(`${BASE_URL}/api/test-connection`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ platform })
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error('UNAUTHORIZED');
    }
    if (!res.ok) throw new Error(`Connection test failed: ${res.statusText}`);
    return await res.json();
  }
};
