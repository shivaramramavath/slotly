// React component for can.
'use client';

import React from 'react';
import { usePermission } from '../hooks/use-permission';
import type { Permission, UserRole } from '@slotly/contracts';

interface CanProps {
  permission?: Permission;
  permissions?: Permission[];
  roles?: UserRole[];
  matchAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** React component rendering can. */
export function Can({
  permission,
  permissions,
  roles,
  matchAll = false,
  children,
  fallback = null,
}: CanProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isRole } =
    usePermission();

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const ok = matchAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    if (!ok) return <>{fallback}</>;
  }

  if (roles && roles.length > 0) {
    if (!isRole(...roles)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
