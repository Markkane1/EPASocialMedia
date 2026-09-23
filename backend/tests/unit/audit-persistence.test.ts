import { SecurityAuditLogger } from '../../src/infrastructure/logging/SecurityAuditLogger';

describe('Security Audit Persistence & Tamper Evidence (Item 14, M-06, M-07, M-08)', () => {
  beforeEach(() => {
    SecurityAuditLogger.clearAll();
  });

  afterEach(() => {
    SecurityAuditLogger.clearAll();
  });

  it('generates cryptographic hash chain across sequential audit records', () => {
    const entry1 = SecurityAuditLogger.record({
      actor: 'admin',
      action: 'LOGIN_ATTEMPT',
      resource: '/api/auth/login',
      result: 'SUCCESS',
      ipAddress: '127.0.0.1'
    });

    expect(entry1.hash).toBeDefined();
    expect(entry1.previousHash).toBe('GENESIS_EPA_PUNJAB_AUDIT');

    const entry2 = SecurityAuditLogger.record({
      actor: 'admin',
      action: 'VIEW_CONFIG',
      resource: '/api/config',
      result: 'SUCCESS',
      ipAddress: '127.0.0.1'
    });

    expect(entry2.hash).toBeDefined();
    // Tamper-evident: entry2's previousHash must equal entry1's hash
    expect(entry2.previousHash).toBe(entry1.hash);
    expect(entry2.hash).not.toBe(entry1.hash);
  });

  it('getDurableLogs returns logs within bounded limits', async () => {
    for (let i = 0; i < 5; i++) {
      SecurityAuditLogger.record({
        actor: 'user',
        action: `ACTION_${i}`,
        resource: '/test',
        result: 'SUCCESS'
      });
    }

    const logs = await SecurityAuditLogger.getDurableLogs(3);
    expect(logs.length).toBe(3);
    expect(logs[0].action).toBe('ACTION_4'); // Most recent first
  });

  it('clearAll resets memory state and genesis hash', () => {
    SecurityAuditLogger.record({
      actor: 'admin',
      action: 'ACTION_A',
      resource: '/test',
      result: 'SUCCESS'
    });

    SecurityAuditLogger.clearAll();
    expect(SecurityAuditLogger.getRecentLogs(10).length).toBe(0);

    const freshEntry = SecurityAuditLogger.record({
      actor: 'admin',
      action: 'ACTION_B',
      resource: '/test',
      result: 'SUCCESS'
    });

    expect(freshEntry.previousHash).toBe('GENESIS_EPA_PUNJAB_AUDIT');
  });
});
