import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

class MockStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('Client-Side Token Storage Security (Item 17, H-01)', () => {
  let ApiClient: any;
  let mockSessionStorage: MockStorage;
  let mockLocalStorage: MockStorage;

  beforeEach(() => {
    mockSessionStorage = new MockStorage();
    mockLocalStorage = new MockStorage();

    const filePath = path.resolve(__dirname, '../../../frontend/src/js/api/apiClient.js');
    const code = fs.readFileSync(filePath, 'utf-8');
    const stripped = code.replace(/export\s+const\s+ApiClient/g, 'var ApiClient');

    const sandbox: Record<string, any> = {
      window: { location: { origin: 'http://localhost:3000' } },
      sessionStorage: mockSessionStorage,
      localStorage: mockLocalStorage,
      fetch: jest.fn(),
      console: console
    };

    vm.createContext(sandbox);
    vm.runInContext(stripped, sandbox);
    ApiClient = sandbox.ApiClient;
    ApiClient.clearToken();
  });

  afterEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  it('stores token in memory and sessionStorage without persisting in localStorage', () => {
    const testToken = 'sample_secure_session_jwt_token_123';
    ApiClient.setToken(testToken);

    expect(ApiClient.getToken()).toBe(testToken);
    expect(mockSessionStorage.getItem('epa_auth_token')).toBe(testToken);
    // Crucial security requirement (H-01): localStorage must remain empty
    expect(mockLocalStorage.getItem('epa_auth_token')).toBeNull();
  });

  it('purges existing localStorage tokens when setting new session token', () => {
    // Simulate legacy dirty localStorage
    mockLocalStorage.setItem('epa_auth_token', 'legacy_stale_token');
    expect(mockLocalStorage.getItem('epa_auth_token')).toBe('legacy_stale_token');

    ApiClient.setToken('new_tab_token');
    expect(mockLocalStorage.getItem('epa_auth_token')).toBeNull();
    expect(mockSessionStorage.getItem('epa_auth_token')).toBe('new_tab_token');
  });

  it('clearToken clears in-memory and storage tokens', () => {
    ApiClient.setToken('token_to_clear');
    expect(ApiClient.getToken()).toBe('token_to_clear');

    ApiClient.clearToken();
    expect(ApiClient.getToken()).toBe('');
    expect(mockSessionStorage.getItem('epa_auth_token')).toBeNull();
    expect(mockLocalStorage.getItem('epa_auth_token')).toBeNull();
  });
});
