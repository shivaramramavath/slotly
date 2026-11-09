// Unit tests validating administrative operations, step-up requirements, and security controls.
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from '../services/admin-users.service';
import type { UserRepository } from '../../users/repositories/user.repository';
import type { SessionsService } from '../../auth/services/sessions.service';
import type { AuditService } from '../../../common/audit/audit.service';
import type { PasswordPolicy } from '../../auth/adapters/password-policy.adapter';
import type { RequestUser } from '../../auth/guards/auth.guard';
import type { User } from '../../users/schemas/user.schema';

describe('Admin Security and User Lifecycle', () => {
  let service: AdminUsersService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockSessionsService: jest.Mocked<SessionsService>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockPasswordPolicy: jest.Mocked<PasswordPolicy>;

  const adminUser: RequestUser = {
    id: 'admin-1',
    email: 'admin@slotly.test',
    role: 'ADMIN',
    sessionId: 'admin-session-123',
    institutionId: 'inst-1',
  };

  const targetUser: User = {
    id: 'user-2',
    email: 'faculty@slotly.test',
    name: 'Faculty User',
    role: 'FACULTY',
    status: 'active',
    isEmailVerified: true,
    mfaEnabled: false,
    mfaRequired: false,
    recoveryCodes: [],
    passwordHistory: [],
    devices: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  } as unknown as User;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      countByInstitution: jest.fn(),
      findWithFilter: jest.fn(),
      countWithFilter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockSessionsService = {
      createSession: jest.fn(),
      validateSession: jest.fn(),
      touchSession: jest.fn(),
      updateSessionInstitution: jest.fn(),
      rotateRefreshToken: jest.fn(),
      revokeSession: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      listUserSessions: jest.fn(),
      setMfaVerified: jest.fn(),
      setStepUp: jest.fn(),
      isStepUpValid: jest.fn(),
      generateAccessToken: jest.fn(),
    } as unknown as jest.Mocked<SessionsService>;

    mockAuditService = {
      log: jest.fn(),
      queryLogs: jest.fn(),
      getUserSecurityEvents: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    mockPasswordPolicy = {
      validate: jest.fn(),
      assertNotReused: jest.fn(),
      hash: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordPolicy>;

    service = new AdminUsersService(
      mockUserRepo,
      mockSessionsService,
      mockAuditService,
      mockPasswordPolicy,
    );
  });

  describe('changeUserRole', () => {
    it('succeeds when session has valid step-up', async () => {
      mockSessionsService.isStepUpValid.mockResolvedValueOnce(true);
      mockUserRepo.findById.mockResolvedValueOnce(targetUser);
      mockUserRepo.update.mockResolvedValueOnce({
        ...targetUser,
        role: 'ADMIN',
      });

      const result = await service.changeUserRole(
        adminUser,
        'user-2',
        { role: 'ADMIN' },
        '127.0.0.1',
      );

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-2', {
        role: 'ADMIN',
      });
      expect(mockSessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-2',
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'user.role_changed',
        'admin-1',
        { type: 'user', id: 'user-2' },
        expect.objectContaining({ previousRole: 'FACULTY', newRole: 'ADMIN' }),
        '127.0.0.1',
      );
      expect(result.role).toBe('ADMIN');
    });

    it('succeeds when valid password is supplied in payload and sets step-up', async () => {
      mockSessionsService.isStepUpValid.mockResolvedValueOnce(false);
      mockUserRepo.findById
        .mockResolvedValueOnce({
          ...targetUser,
          id: 'admin-1',
          passwordHash: 'hashed_admin_password',
        } as unknown as User) // for admin doc lookup
        .mockResolvedValueOnce(targetUser); // for target user lookup

      mockPasswordPolicy.verify.mockResolvedValueOnce(true);
      mockUserRepo.update.mockResolvedValueOnce({
        ...targetUser,
        role: 'DESIGNER',
      });

      const result = await service.changeUserRole(adminUser, 'user-2', {
        role: 'DESIGNER',
        password: 'correct_admin_password',
      });

      expect(mockSessionsService.setStepUp).toHaveBeenCalledWith(
        'admin-session-123',
      );
      expect(mockUserRepo.update).toHaveBeenCalledWith('user-2', {
        role: 'DESIGNER',
      });
      expect(result.role).toBe('DESIGNER');
    });

    it('throws ForbiddenException with STEP_UP_REQUIRED when not stepped up and no valid credentials', async () => {
      mockSessionsService.isStepUpValid.mockResolvedValueOnce(false);

      await expect(
        service.changeUserRole(adminUser, 'user-2', { role: 'ADMIN' }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target user does not exist', async () => {
      mockSessionsService.isStepUpValid.mockResolvedValueOnce(true);
      mockUserRepo.findById.mockResolvedValueOnce(null);

      await expect(
        service.changeUserRole(adminUser, 'non-existent', { role: 'ADMIN' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('forcePasswordReset', () => {
    it('sets mustResetPassword to true, revokes sessions, and audits event', async () => {
      mockUserRepo.findById.mockResolvedValueOnce(targetUser);

      await service.forcePasswordReset(adminUser, 'user-2', '127.0.0.1');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-2', {
        mustResetPassword: true,
      });
      expect(mockSessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-2',
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'user.force_password_reset',
        'admin-1',
        { type: 'user', id: 'user-2' },
        expect.objectContaining({ targetEmail: targetUser.email }),
        '127.0.0.1',
      );
    });
  });

  describe('requireMfa', () => {
    it('sets mfaRequired to true and audits event', async () => {
      mockUserRepo.findById.mockResolvedValueOnce(targetUser);

      await service.requireMfa(adminUser, 'user-2', '127.0.0.1');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-2', {
        mfaRequired: true,
      });
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'user.require_mfa',
        'admin-1',
        { type: 'user', id: 'user-2' },
        expect.objectContaining({ targetEmail: targetUser.email }),
        '127.0.0.1',
      );
    });
  });

  describe('revokeUserSession', () => {
    it('terminates session and audits event', async () => {
      await service.revokeUserSession(
        adminUser,
        'user-2',
        'sess-abc',
        '127.0.0.1',
      );

      expect(mockSessionsService.revokeSession).toHaveBeenCalledWith(
        'sess-abc',
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'user.session_revoked',
        'admin-1',
        { type: 'user', id: 'user-2' },
        expect.objectContaining({ revokedSessionId: 'sess-abc' }),
        '127.0.0.1',
      );
    });
  });
});
