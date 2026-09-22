import { hasPermission, ROLE_PERMISSIONS, Permission } from '../../src/infrastructure/auth/Permissions';
import { UserRoleType } from '../../src/domain/entities/User';

describe('RBAC Roles & Permissions Model', () => {
  test('ADMIN role possesses all system permissions', () => {
    const adminPerms = ROLE_PERMISSIONS.ADMIN;
    expect(adminPerms).toContain('VIEW_METRICS');
    expect(adminPerms).toContain('TRIGGER_SYNC');
    expect(adminPerms).toContain('MANAGE_CONFIG');
    expect(adminPerms).toContain('TEST_CONNECTION');
    expect(adminPerms).toContain('MANAGE_USERS');

    expect(hasPermission('ADMIN', 'VIEW_METRICS')).toBe(true);
    expect(hasPermission('ADMIN', 'TRIGGER_SYNC')).toBe(true);
    expect(hasPermission('ADMIN', 'MANAGE_CONFIG')).toBe(true);
    expect(hasPermission('ADMIN', 'TEST_CONNECTION')).toBe(true);
    expect(hasPermission('ADMIN', 'MANAGE_USERS')).toBe(true);
  });

  test('EXECUTIVE role possesses VIEW_METRICS only and is barred from administrative operations', () => {
    expect(hasPermission('EXECUTIVE', 'VIEW_METRICS')).toBe(true);

    // Administrative privileges are strictly forbidden
    expect(hasPermission('EXECUTIVE', 'TRIGGER_SYNC')).toBe(false);
    expect(hasPermission('EXECUTIVE', 'MANAGE_CONFIG')).toBe(false);
    expect(hasPermission('EXECUTIVE', 'TEST_CONNECTION')).toBe(false);
    expect(hasPermission('EXECUTIVE', 'MANAGE_USERS')).toBe(false);
  });

  test('Unknown role or invalid permission returns false', () => {
    expect(hasPermission('UNKNOWN' as UserRoleType, 'VIEW_METRICS')).toBe(false);
    expect(hasPermission('EXECUTIVE', 'INVALID_ACTION' as Permission)).toBe(false);
  });
});
