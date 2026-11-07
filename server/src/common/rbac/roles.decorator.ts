// Core implementation for roles.decorator in server/src/common/rbac.
import { SetMetadata } from '@nestjs/common';
import { UserRole, Permission } from '@slotly/contracts';

/** Constant representing roles key. */
export const ROLES_KEY = 'roles';
/** React component rendering roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Constant representing permissions key. */
export const PERMISSIONS_KEY = 'permissions';
/** React component rendering require permissions. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
