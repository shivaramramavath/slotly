// HTTP controller managing administrative user actions, roles, MFA, and sessions.
import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Ip,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ChangeUserRoleDtoSchema,
  type ChangeUserRoleDto,
  type AdminUserListItemDto,
  type UserSessionItemDto,
  type SecurityEventDto,
  type UserRole,
} from '@slotly/contracts';
import { AdminUsersService } from '../services/admin-users.service';

/** Administrative controller governing user accounts, credential policies, and active sessions. */
@Controller('admin/users')
@UseGuards(AuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  /** Lists users with pagination and search filters. */
  @Get()
  @RequirePermissions('USER_MANAGE')
  async listUsers(
    @Req() req: { user: RequestUser },
    @Query('role') role?: UserRole,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: AdminUserListItemDto[]; total: number }> {
    return this.adminUsersService.listUsers({
      institutionId: req.user.institutionId,
      role,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  /** Modifies a user's role, strictly requiring step-up authentication. */
  @Patch(':userId/role')
  @RequirePermissions('USER_MANAGE')
  async changeUserRole(
    @Req() req: { user: RequestUser },
    @Param('userId') targetUserId: string,
    @Body(new ZodValidationPipe(ChangeUserRoleDtoSchema))
    dto: ChangeUserRoleDto,
    @Ip() ipAddress: string,
  ): Promise<AdminUserListItemDto> {
    return this.adminUsersService.changeUserRole(
      req.user,
      targetUserId,
      dto,
      ipAddress,
    );
  }

  /** Forces a user to reset their password upon next sign in. */
  @Post(':userId/force-password-reset')
  @RequirePermissions('USER_MANAGE')
  async forcePasswordReset(
    @Req() req: { user: RequestUser },
    @Param('userId') targetUserId: string,
    @Ip() ipAddress: string,
  ): Promise<{ message: string }> {
    await this.adminUsersService.forcePasswordReset(
      req.user,
      targetUserId,
      ipAddress,
    );
    return {
      message: `Password reset successfully enforced for user ${targetUserId}`,
    };
  }

  /** Enforces mandatory multi-factor authentication for a user account. */
  @Post(':userId/require-mfa')
  @RequirePermissions('USER_MANAGE')
  async requireMfa(
    @Req() req: { user: RequestUser },
    @Param('userId') targetUserId: string,
    @Ip() ipAddress: string,
  ): Promise<{ message: string }> {
    await this.adminUsersService.requireMfa(req.user, targetUserId, ipAddress);
    return {
      message: `MFA requirement successfully enabled for user ${targetUserId}`,
    };
  }

  /** Lists active Redis sessions for a target user. */
  @Get(':userId/sessions')
  @RequirePermissions('USER_MANAGE')
  async getUserSessions(
    @Param('userId') targetUserId: string,
  ): Promise<UserSessionItemDto[]> {
    return this.adminUsersService.getUserSessions(targetUserId);
  }

  /** Terminates an active session for a user. */
  @Delete(':userId/sessions/:sessionId')
  @RequirePermissions('USER_MANAGE')
  async revokeUserSession(
    @Req() req: { user: RequestUser },
    @Param('userId') targetUserId: string,
    @Param('sessionId') sessionId: string,
    @Ip() ipAddress: string,
  ): Promise<{ message: string }> {
    await this.adminUsersService.revokeUserSession(
      req.user,
      targetUserId,
      sessionId,
      ipAddress,
    );
    return { message: `Session ${sessionId} successfully revoked` };
  }

  /** Lists security audit events related to a user account. */
  @Get(':userId/security-events')
  @RequirePermissions('USER_MANAGE')
  async getUserSecurityEvents(
    @Param('userId') targetUserId: string,
  ): Promise<SecurityEventDto[]> {
    return this.adminUsersService.getUserSecurityEvents(targetUserId);
  }
}
