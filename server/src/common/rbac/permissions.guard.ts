import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, RolePermissions } from '@slotly/contracts';
import type { UserRole } from '@slotly/contracts';
import { PERMISSIONS_KEY } from './roles.decorator';
import { ACCESS_POLICY } from './access-policy.interface';
import type {
  AccessPolicy,
  AccessSubject,
  AccessResource,
} from './access-policy.interface';

export interface RequestWithSubject {
  user?: {
    id: string;
    role: UserRole;
    institutionId?: string | undefined;
    departmentId?: string | undefined;
  };
  resource?: AccessResource;
}

@Injectable()
export class StandardAccessPolicy implements AccessPolicy {
  can(
    subject: AccessSubject,
    permission: Permission,
    resource?: AccessResource,
  ): Promise<boolean> {
    if (subject.role === 'SUPER_ADMIN') {
      return Promise.resolve(true);
    }

    const allowed = RolePermissions[subject.role] || [];
    if (!allowed.includes(permission)) {
      return Promise.resolve(false);
    }

    // Resource-level boundary checks
    if (resource) {
      if (resource.institutionId && subject.institutionId) {
        if (resource.institutionId !== subject.institutionId) {
          return Promise.resolve(false); // cannot access another institution's data
        }
      }
      if (resource.ownerId && subject.role !== 'ADMIN') {
        if (resource.ownerId !== subject.userId) {
          return Promise.resolve(false);
        }
      }
    }

    return Promise.resolve(true);
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject(ACCESS_POLICY)
    private readonly accessPolicy?: AccessPolicy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithSubject>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: 'PERMISSION_DENIED',
        message: 'Authentication required to access this resource.',
      });
    }

    const subject: AccessSubject = {
      userId: user.id,
      role: user.role,
      institutionId: user.institutionId,
      departmentId: user.departmentId,
    };

    const policy = this.accessPolicy || new StandardAccessPolicy();

    for (const perm of requiredPermissions) {
      const allowed = await policy.can(subject, perm, request.resource);
      if (!allowed) {
        throw new ForbiddenException({
          code: 'PERMISSION_DENIED',
          message: `You lack the required permission: ${perm}`,
        });
      }
    }

    return true;
  }
}
