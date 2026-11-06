import { Permission, UserRole } from '@slotly/contracts';

export const ACCESS_POLICY = Symbol('ACCESS_POLICY');

export interface AccessSubject {
  userId: string;
  role: UserRole;
  institutionId?: string | undefined;
  departmentId?: string | undefined;
}

export interface AccessResource {
  type: string;
  id?: string | undefined;
  institutionId?: string | undefined;
  departmentId?: string | undefined;
  ownerId?: string | undefined;
}

export interface AccessPolicy {
  can(
    subject: AccessSubject,
    permission: Permission,
    resource?: AccessResource,
  ): Promise<boolean>;
}
