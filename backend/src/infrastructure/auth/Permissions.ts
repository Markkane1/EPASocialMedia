import { UserRoleType } from '../../domain/entities/User';

export type Permission =
  | 'VIEW_METRICS'
  | 'TRIGGER_SYNC'
  | 'MANAGE_CONFIG'
  | 'TEST_CONNECTION'
  | 'MANAGE_USERS';

export const ROLE_PERMISSIONS: Record<UserRoleType, readonly Permission[]> = {
  ADMIN: [
    'VIEW_METRICS',
    'TRIGGER_SYNC',
    'MANAGE_CONFIG',
    'TEST_CONNECTION',
    'MANAGE_USERS'
  ],
  EXECUTIVE: [
    'VIEW_METRICS'
  ]
};

export function hasPermission(role: UserRoleType, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}
