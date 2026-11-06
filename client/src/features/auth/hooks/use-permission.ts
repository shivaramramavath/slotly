'use client';

import { useAuthStore } from '../store/auth.store';
import { Permission, RolePermissions } from '@slotly/contracts';
import type { UserRole } from '@slotly/contracts';

export function usePermission() {
  const user = useAuthStore((s) => s.user);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;

    const allowed = RolePermissions[user.role as UserRole] || [];
    return allowed.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  };

  const isRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role as UserRole);
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
  };
}
