// Core implementation for access-policy.interface in server/src/common/rbac.
import { Permission, UserRole } from '@slotly/contracts';

/** Constant representing access policy. */
export const ACCESS_POLICY = Symbol('ACCESS_POLICY');

/** Interface defining structure for access subject. */
export interface AccessSubject {
  userId: string;
  role: UserRole;
  institutionId?: string | undefined;
  departmentId?: string | undefined;
}

/** Interface defining structure for access resource. */
export interface AccessResource {
  type: string;
  id?: string | undefined;
  institutionId?: string | undefined;
  departmentId?: string | undefined;
  ownerId?: string | undefined;
}

/** Interface defining structure for access policy. */
export interface AccessPolicy {
  can(
    subject: AccessSubject,
    permission: Permission,
    resource?: AccessResource,
  ): Promise<boolean>;
}
