import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, Permission, RolePermissions } from '@slotly/contracts';
import { ROLES_KEY, PERMISSIONS_KEY } from './roles.decorator';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  institutionId?: string;
  departmentId?: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: 'PERMISSION_DENIED',
        message: 'Authentication required for this resource',
      });
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException({
          code: 'PERMISSION_DENIED',
          message: `Role "${user.role}" does not have access to this resource`,
        });
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = RolePermissions[user.role] || [];
      const hasAllPermissions = requiredPermissions.every((perm) =>
        userPermissions.includes(perm),
      );
      if (!hasAllPermissions) {
        throw new ForbiddenException({
          code: 'PERMISSION_DENIED',
          message:
            'User does not hold the required permissions for this action',
        });
      }
    }

    return true;
  }
}
