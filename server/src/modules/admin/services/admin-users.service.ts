// Administrative service managing user accounts, role escalations, step-up verification, and security events.
import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import type {
  AdminUserListItemDto,
  ChangeUserRoleDto,
  UserSessionItemDto,
  SecurityEventDto,
  UserRole,
} from '@slotly/contracts';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../users/repositories/user.repository';
import {
  SESSIONS_SERVICE,
  type SessionsService,
} from '../../auth/services/sessions.service';
import { AuditService } from '../../../common/audit/audit.service';
import {
  PASSWORD_POLICY,
  type PasswordPolicy,
} from '../../auth/adapters/password-policy.adapter';
import type { RequestUser } from '../../auth/guards/auth.guard';
import type { User } from '../../users/schemas/user.schema';

/** Administrative service controlling user lifecycle, role changes, and security postures. */
@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(SESSIONS_SERVICE) private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
    @Optional()
    @Inject(PASSWORD_POLICY)
    private readonly passwordPolicy?: PasswordPolicy,
  ) {}

  /**
   * Retrieves paginated users matching administrative query filters.
   */
  async listUsers(options: {
    institutionId?: string | undefined;
    role?: UserRole | undefined;
    status?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }): Promise<{ items: AdminUserListItemDto[]; total: number }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 50;
    const offset = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userRepo.findWithFilter({
        institutionId: options.institutionId,
        role: options.role,
        status: options.status,
        search: options.search,
        limit,
        offset,
      }),
      this.userRepo.countWithFilter({
        institutionId: options.institutionId,
        role: options.role,
        status: options.status,
        search: options.search,
      }),
    ]);

    const items: AdminUserListItemDto[] = users.map((u) =>
      this.mapToAdminDto(u),
    );
    return { items, total };
  }

  /**
   * Modifies a user's role, strictly requiring verified step-up authentication.
   */
  async changeUserRole(
    admin: RequestUser,
    targetUserId: string,
    dto: ChangeUserRoleDto,
    ipAddress?: string,
  ): Promise<AdminUserListItemDto> {
    // 1. Verify step-up validity
    let isSteppedUp = false;
    if (admin.sessionId) {
      isSteppedUp = await this.sessionsService.isStepUpValid(admin.sessionId);
    }

    if (!isSteppedUp && dto.password && this.passwordPolicy) {
      const adminDoc = await this.userRepo.findById(admin.id);
      if (adminDoc?.passwordHash) {
        const matches = await this.passwordPolicy.verify(
          adminDoc.passwordHash,
          dto.password,
        );
        if (matches && admin.sessionId) {
          await this.sessionsService.setStepUp(admin.sessionId);
          isSteppedUp = true;
        }
      }
    }

    if (!isSteppedUp) {
      throw new ForbiddenException({
        code: 'STEP_UP_REQUIRED',
        message:
          'Recent step-up authentication is required to modify user roles.',
      });
    }

    // 2. Fetch target user
    const targetUser = await this.userRepo.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    const previousRole = targetUser.role;

    // 3. Update role
    const updated = await this.userRepo.update(targetUserId, {
      role: dto.role,
    });
    if (!updated) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    // 4. Invalidate existing sessions for target user so new role applies immediately
    await this.sessionsService.revokeAllUserSessions(targetUserId);

    // 5. Audit log
    await this.auditService.log(
      'user.role_changed',
      admin.id,
      { type: 'user', id: targetUserId },
      {
        targetEmail: targetUser.email,
        previousRole,
        newRole: dto.role,
      },
      ipAddress,
    );

    return this.mapToAdminDto(updated);
  }

  /**
   * Retrieves active Redis sessions for a given user.
   */
  async getUserSessions(targetUserId: string): Promise<UserSessionItemDto[]> {
    const sessions = await this.sessionsService.listUserSessions(targetUserId);

    return sessions.map((s) => ({
      sessionId: s.sessionId,
      userId: s.userId,
      device: s.device || 'Unknown Device',
      browser: s.browser || 'Unknown Browser',
      ip: s.ip || '127.0.0.1',
      createdAt: new Date(s.createdAt).toISOString(),
      lastActiveAt: new Date(s.lastActiveAt).toISOString(),
    }));
  }

  /**
   * Terminates a specific user session.
   */
  async revokeUserSession(
    admin: RequestUser,
    targetUserId: string,
    sessionId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.sessionsService.revokeSession(sessionId);

    await this.auditService.log(
      'user.session_revoked',
      admin.id,
      { type: 'user', id: targetUserId },
      { targetUserId, revokedSessionId: sessionId },
      ipAddress,
    );
  }

  /**
   * Retrieves security audit events for a specific user.
   */
  async getUserSecurityEvents(
    targetUserId: string,
  ): Promise<SecurityEventDto[]> {
    return this.auditService.getUserSecurityEvents(targetUserId);
  }

  /**
   * Forces a password reset on next login and terminates active sessions.
   */
  async forcePasswordReset(
    admin: RequestUser,
    targetUserId: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    await this.userRepo.update(targetUserId, {
      mustResetPassword: true,
    });

    await this.sessionsService.revokeAllUserSessions(targetUserId);

    await this.auditService.log(
      'user.force_password_reset',
      admin.id,
      { type: 'user', id: targetUserId },
      { targetEmail: user.email },
      ipAddress,
    );
  }

  /**
   * Enforces mandatory MFA for a user upon subsequent authentications.
   */
  async requireMfa(
    admin: RequestUser,
    targetUserId: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    await this.userRepo.update(targetUserId, {
      mfaRequired: true,
    });

    await this.auditService.log(
      'user.require_mfa',
      admin.id,
      { type: 'user', id: targetUserId },
      { targetEmail: user.email },
      ipAddress,
    );
  }

  /**
   * Maps a User schema entity to AdminUserListItemDto.
   */
  private mapToAdminDto(user: User): AdminUserListItemDto {
    const docWithDates = user as unknown as {
      createdAt?: Date;
      updatedAt?: Date;
    };
    return {
      id: String(user.id ?? user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status || 'active',
      mfaRequired: user.mfaRequired || false,
      mfaEnabled: user.mfaEnabled || false,
      createdAt: (docWithDates.createdAt
        ? new Date(docWithDates.createdAt)
        : new Date()
      ).toISOString(),
      lastActiveAt: docWithDates.updatedAt
        ? new Date(docWithDates.updatedAt).toISOString()
        : undefined,
    };
  }
}
