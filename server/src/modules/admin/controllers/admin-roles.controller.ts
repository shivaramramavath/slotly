// HTTP controller exposing role definitions and permissions matrix.
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import {
  RolePermissions,
  type RolePermissionsMatrixDto,
} from '@slotly/contracts';

/** Administrative controller returning platform role and permission matrix. */
@Controller('admin/roles')
@UseGuards(AuthGuard, PermissionsGuard)
export class AdminRolesController {
  /** Retrieves the comprehensive platform role-to-permissions capability mapping. */
  @Get()
  @RequirePermissions('USER_MANAGE')
  getRoles(): RolePermissionsMatrixDto {
    return {
      roles: RolePermissions,
    };
  }
}
