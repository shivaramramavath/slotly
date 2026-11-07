// Domain service orchestrating auth.service business logic.
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { randomBytes } from 'crypto';
import type {
  RegisterDto,
  LoginDto,
  AuthResponse,
  VerifyEmailDto,
  ResetPasswordDto,
  ChangePasswordDto,
  MfaEnrollResponse,
  MfaVerifyDto,
  MfaRecoveryDto,
  StepUpDto,
  UserDto,
  UserRole,
} from '@slotly/contracts';
import type { AuthService, ClientMeta } from './auth.interface';
import { USER_REPOSITORY } from '../users/repositories/user.repository';
import type { UserRepository } from '../users/repositories/user.repository';
import { INSTITUTION_REPOSITORY } from '../institutions/repositories/institution.repository';
import type { InstitutionRepository } from '../institutions/repositories/institution.repository';
import { SESSIONS_SERVICE } from './services/sessions.service';
import type { SessionsService } from './services/sessions.service';
import { OTP_SERVICE } from './services/otp.service';
import type { OtpService } from './services/otp.service';
import { THROTTLER_SERVICE } from './services/throttler.service';
import type { ThrottlerService } from './services/throttler.service';
import { PASSWORD_POLICY } from './adapters/password-policy.adapter';
import type { PasswordPolicy } from './adapters/password-policy.adapter';
import { TOTP_ADAPTER } from './adapters/totp.adapter';
import type { TotpAdapter } from './adapters/totp.adapter';
import { EMAIL_ADAPTER } from './adapters/email.adapter';
import type { EmailAdapter } from './adapters/email.adapter';
import { OAUTH_VERIFIER } from './adapters/oauth.adapter';
import type { OAuthVerifier } from './adapters/oauth.adapter';
import { AuditService } from '../../common/audit/audit.service';
import { CACHE_SERVICE } from '../../common/cache/cache.interface';
import type { CacheService } from '../../common/cache/cache.interface';
import type { User } from '../users/schemas/user.schema';

/** Injectable service providing default auth service logic. */
@Injectable()
export class DefaultAuthService implements AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(SESSIONS_SERVICE) private readonly sessionsService: SessionsService,
    @Inject(OTP_SERVICE) private readonly otpService: OtpService,
    @Inject(THROTTLER_SERVICE) private readonly throttler: ThrottlerService,
    @Inject(PASSWORD_POLICY) private readonly passwordPolicy: PasswordPolicy,
    @Inject(TOTP_ADAPTER) private readonly totpAdapter: TotpAdapter,
    @Inject(EMAIL_ADAPTER) private readonly emailAdapter: EmailAdapter,
    @Inject(OAUTH_VERIFIER) private readonly oauthVerifier: OAuthVerifier,
    @Inject(CACHE_SERVICE) private readonly cache: CacheService,
    private readonly auditService: AuditService,
    @Optional()
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo?: InstitutionRepository,
  ) {}

  private toUserDto(user: User): UserDto {
    const id = (user.id || user._id)?.toString() || '';
    return {
      id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId?.toString(),
      departmentId: user.departmentId?.toString(),
      isEmailVerified: user.isEmailVerified,
      mfaEnabled: user.mfaEnabled,
      status: user.status || 'active',
    };
  }

  private getEntityId(
    entity: { id?: string | undefined; _id?: unknown } | null | undefined,
  ): string | undefined {
    if (!entity) return undefined;
    if (entity.id) return entity.id;
    if (typeof entity._id === 'string') return entity._id;
    if (
      entity._id &&
      typeof (entity._id as { toString?: () => string }).toString === 'function'
    ) {
      return (entity._id as { toString: () => string }).toString();
    }
    return undefined;
  }

  async register(
    dto: RegisterDto,
    meta: ClientMeta,
  ): Promise<{ user: UserDto; accessToken: string; refreshToken: string }> {
    const email = dto.email.toLowerCase().trim();
    await this.throttler.consume('register', meta.ip || '127.0.0.1', 10, 3600);

    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new BadRequestException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.',
      });
    }

    await this.passwordPolicy.validate(dto.password);
    const passwordHash = await this.passwordPolicy.hash(dto.password);

    // First user of an institution becomes ADMIN
    const count = await this.userRepo.countByInstitution();
    const role: UserRole = count === 0 ? 'ADMIN' : 'DESIGNER';

    let institutionId: Types.ObjectId | undefined;
    if (this.institutionRepo) {
      if (dto.institutionName?.trim()) {
        const instName = dto.institutionName.trim();
        const instCode =
          dto.institutionCode?.trim().toUpperCase() ||
          instName
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 6)
            .toUpperCase() ||
          'INST';
        const newInst = await this.institutionRepo.create({
          name: instName,
          code: instCode,
          workingDays: [1, 2, 3, 4, 5],
          defaultPeriodConfig: {
            startTime: '09:00',
            periodDuration: 50,
            periodsPerDay: 7,
            breaks: [
              { name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 },
            ],
          },
          isComplete: true,
          isDeleted: false,
        });
        const id = this.getEntityId(newInst);
        if (id) institutionId = new Types.ObjectId(id);
      } else {
        let firstInst = await this.institutionRepo.findOne({
          isDeleted: false,
        });
        if (!firstInst) {
          firstInst = await this.institutionRepo.create({
            name: `${dto.name.trim()}'s Institution`,
            code: 'MAIN',
            workingDays: [1, 2, 3, 4, 5],
            defaultPeriodConfig: {
              startTime: '09:00',
              periodDuration: 50,
              periodsPerDay: 7,
              breaks: [
                { name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 },
              ],
            },
            isComplete: true,
            isDeleted: false,
          });
        }
        if (firstInst) {
          const id = this.getEntityId(firstInst);
          if (id) institutionId = new Types.ObjectId(id);
        }
      }
    }

    const created = await this.userRepo.create({
      email,
      name: dto.name.trim(),
      passwordHash,
      role,
      institutionId,
      isEmailVerified: false,
      mfaEnabled: false,
      status: 'active',
      passwordHistory: [passwordHash],
      devices: [],
    });

    const userDto = this.toUserDto(created);

    // Send verification OTP
    const otpCode = await this.otpService.createOtp(
      email,
      'verify_email',
      600,
      60,
    );
    await this.emailAdapter.sendOtp(email, otpCode, 'verify');

    // Create session
    const { session, accessToken, refreshToken } =
      await this.sessionsService.createSession(userDto.id, userDto.role, {
        institutionId: userDto.institutionId,
        device: meta.device,
        browser: meta.browser,
        ip: meta.ip,
        mfaVerified: false,
      });

    await this.auditService.log(
      'AUTH_SESSION_CREATED',
      userDto.id,
      { type: 'user', id: userDto.id },
      { sessionId: session.sessionId, role: userDto.role },
      meta.ip,
    );

    return { user: userDto, accessToken, refreshToken };
  }

  async login(
    dto: LoginDto,
    meta: ClientMeta,
  ): Promise<{ response: AuthResponse; refreshToken?: string | undefined }> {
    const email = dto.email.toLowerCase().trim();
    const throttleKey = `${meta.ip || '127.0.0.1'}:${email}`;
    await this.throttler.consume('login', throttleKey, 5, 300);

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      await this.auditService.log(
        'AUTH_LOGIN_FAILED',
        'anonymous',
        { type: 'user', id: email },
        { reason: 'USER_NOT_FOUND' },
        meta.ip,
      );
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password combination.',
      });
    }

    if (user.status !== 'active') {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED_OR_INACTIVE',
        message:
          'Your account is suspended or deactivated. Please contact your institution administrator.',
      });
    }

    const passwordValid = await this.passwordPolicy.verify(
      user.passwordHash,
      dto.password,
    );
    if (!passwordValid) {
      const userId =
        (user as unknown as { _id?: { toString(): string } })._id?.toString() ||
        user.email;
      await this.auditService.log(
        'AUTH_LOGIN_FAILED',
        userId,
        { type: 'user', id: userId },
        { reason: 'INVALID_PASSWORD' },
        meta.ip,
      );
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password combination.',
      });
    }

    await this.throttler.reset('login', throttleKey);

    const userDto = this.toUserDto(user);

    if (!user.institutionId && this.institutionRepo) {
      let firstInst = await this.institutionRepo.findOne({
        isDeleted: false,
      });
      if (!firstInst) {
        firstInst = await this.institutionRepo.create({
          name: 'Main Campus',
          code: 'MAIN',
          workingDays: [1, 2, 3, 4, 5],
          defaultPeriodConfig: {
            startTime: '09:00',
            periodDuration: 50,
            periodsPerDay: 7,
            breaks: [
              { name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 },
            ],
          },
          isComplete: true,
          isDeleted: false,
        });
      }
      if (firstInst) {
        const id = this.getEntityId(firstInst);
        if (id) {
          const instObjId = new Types.ObjectId(id);
          user.institutionId = instObjId;
          userDto.institutionId = id;
          const uId = this.getEntityId(user);
          if (uId) {
            await this.userRepo.update(uId, { institutionId: instObjId });
          }
        }
      }
    }

    // If MFA is enabled on the account
    if (user.mfaEnabled && user.mfaSecret) {
      if (!dto.code) {
        // Issue temporary signed MFA challenge token
        const mfaToken = `mfa_${Buffer.from(JSON.stringify({ userId: userDto.id, exp: Date.now() + 300000 })).toString('base64url')}`;
        return {
          response: {
            mfaRequired: true,
            mfaToken,
          },
        };
      }

      // Verify code
      const isTotpValid = this.totpAdapter.verifyCode(dto.code, user.mfaSecret);
      let isRecoveryValid = false;

      if (!isTotpValid && user.recoveryCodes?.length > 0) {
        for (const hashedCode of user.recoveryCodes) {
          if (this.totpAdapter.verifyRecoveryCode(dto.code, hashedCode)) {
            isRecoveryValid = true;
            // Remove used recovery code
            const remaining = user.recoveryCodes.filter(
              (c) => c !== hashedCode,
            );
            await this.userRepo.update(userDto.id, {
              recoveryCodes: remaining,
            });
            await this.emailAdapter.sendSecurityAlert(
              user.email,
              'Recovery Code Used',
              { remainingCount: remaining.length },
            );
            break;
          }
        }
      }

      if (!isTotpValid && !isRecoveryValid) {
        throw new UnauthorizedException({
          code: 'INVALID_MFA_CODE',
          message: 'Invalid two-factor authentication code.',
        });
      }
    }

    // Establish session
    const { session, accessToken, refreshToken } =
      await this.sessionsService.createSession(userDto.id, userDto.role, {
        institutionId: userDto.institutionId,
        device: meta.device,
        browser: meta.browser,
        ip: meta.ip,
        mfaVerified: user.mfaEnabled,
      });

    await this.auditService.log(
      'AUTH_LOGIN_SUCCESS',
      userDto.id,
      { type: 'user', id: userDto.id },
      { sessionId: session.sessionId },
      meta.ip,
    );

    return {
      response: {
        accessToken,
        user: userDto,
      },
      refreshToken,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionsService.revokeSession(sessionId);
    await this.auditService.log(
      'AUTH_LOGOUT',
      'system',
      { type: 'session', id: sessionId },
      { sessionId },
    );
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionsService.revokeAllUserSessions(userId);
    await this.auditService.log(
      'AUTH_SESSION_REVOKED',
      userId,
      { type: 'user', id: userId },
      { allSessions: true },
    );
  }

  async refresh(
    sessionId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: UserDto }> {
    const rotated = await this.sessionsService.rotateRefreshToken(
      sessionId,
      refreshToken,
    );
    const user = await this.userRepo.findById(rotated.session.userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    if (!user.institutionId && this.institutionRepo) {
      let firstInst = await this.institutionRepo.findOne({
        isDeleted: false,
      });
      if (!firstInst) {
        firstInst = await this.institutionRepo.create({
          name: 'Main Campus',
          code: 'MAIN',
          workingDays: [1, 2, 3, 4, 5],
          defaultPeriodConfig: {
            startTime: '09:00',
            periodDuration: 50,
            periodsPerDay: 7,
            breaks: [
              { name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 },
            ],
          },
          isComplete: true,
          isDeleted: false,
        });
      }
      if (firstInst) {
        const id = this.getEntityId(firstInst);
        if (id) {
          const instObjId = new Types.ObjectId(id);
          user.institutionId = instObjId;
          const uId = this.getEntityId(user);
          if (uId) {
            await this.userRepo.update(uId, { institutionId: instObjId });
          }
          await this.sessionsService.updateSessionInstitution(sessionId, id);
        }
      }
    }

    await this.auditService.log(
      'AUTH_TOKEN_REFRESHED',
      user.email,
      { type: 'session', id: sessionId },
      { version: rotated.session.version },
    );

    return {
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      user: this.toUserDto(user),
    };
  }

  async revokeSession(
    sessionIdToRevoke: string,
    actorUserId: string,
  ): Promise<void> {
    await this.sessionsService.revokeSession(sessionIdToRevoke);
    await this.auditService.log(
      'AUTH_SESSION_REVOKED',
      actorUserId,
      { type: 'session', id: sessionIdToRevoke },
      { revokedBy: actorUserId },
    );
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    await this.otpService.verifyOtp(email, 'verify_email', dto.code);

    const user = await this.userRepo.findByEmail(email);
    if (user) {
      const userId =
        (user as unknown as { _id?: { toString(): string } })._id?.toString() ||
        user.email;
      await this.userRepo.update(userId, { isEmailVerified: true });
    }

    return { message: 'Email verified successfully.' };
  }

  async resendEmailVerification(email: string): Promise<{ message: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(cleanEmail);
    // Generic response to prevent enumeration
    if (user && !user.isEmailVerified) {
      const code = await this.otpService.createOtp(
        cleanEmail,
        'verify_email',
        600,
        60,
      );
      await this.emailAdapter.sendOtp(cleanEmail, code, 'verify');
    }
    return {
      message:
        'If the account exists and is unverified, a code has been dispatched.',
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(cleanEmail);
    // Generic response to prevent user enumeration
    if (user && user.status === 'active') {
      const code = await this.otpService.createOtp(
        cleanEmail,
        'password_reset',
        900,
        60,
      );
      await this.emailAdapter.sendOtp(cleanEmail, code, 'recovery');
    }
    return {
      message:
        'If this email is associated with an account, a reset code has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.passwordPolicy.validate(dto.newPassword);

    // Look for reset token record or email
    const resetKey = `slotly:pwd_reset:${dto.token}`;
    const userEmail = await this.cache.get<string>(resetKey);
    if (!userEmail) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'Password reset link is invalid or has expired.',
      });
    }

    const user = await this.userRepo.findByEmail(userEmail);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const userId =
      (user as unknown as { _id?: { toString(): string } })._id?.toString() ||
      user.email;
    await this.passwordPolicy.assertNotReused(
      dto.newPassword,
      user.passwordHistory || [],
    );

    const newHash = await this.passwordPolicy.hash(dto.newPassword);
    const updatedHistory = [
      newHash,
      ...(user.passwordHistory || []).slice(0, 4),
    ];

    await this.userRepo.update(userId, {
      passwordHash: newHash,
      passwordHistory: updatedHistory,
    });

    // Invalidate reset token
    await this.cache.del(resetKey);

    // Revoke all existing sessions after password reset
    await this.sessionsService.revokeAllUserSessions(userId);

    await this.emailAdapter.sendSecurityAlert(
      user.email,
      'Password Reset Completed',
      {},
    );
    await this.auditService.log('AUTH_PASSWORD_RESET', userId, {
      type: 'user',
      id: userId,
    });

    return {
      message:
        'Password has been updated. Please sign in with your new password.',
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    currentSessionId?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const currentMatches = await this.passwordPolicy.verify(
      user.passwordHash,
      dto.currentPassword,
    );
    if (!currentMatches) {
      throw new BadRequestException({
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'The current password provided is incorrect.',
      });
    }

    await this.passwordPolicy.validate(dto.newPassword);
    await this.passwordPolicy.assertNotReused(
      dto.newPassword,
      user.passwordHistory || [],
    );

    const newHash = await this.passwordPolicy.hash(dto.newPassword);
    const updatedHistory = [
      newHash,
      ...(user.passwordHistory || []).slice(0, 4),
    ];

    await this.userRepo.update(userId, {
      passwordHash: newHash,
      passwordHistory: updatedHistory,
    });

    // Revoke all other sessions
    await this.sessionsService.revokeAllUserSessions(userId, currentSessionId);

    await this.emailAdapter.sendSecurityAlert(
      user.email,
      'Password Changed',
      {},
    );
    await this.auditService.log('AUTH_PASSWORD_CHANGED', userId, {
      type: 'user',
      id: userId,
    });

    return {
      message:
        'Password updated successfully. Other sessions have been revoked.',
    };
  }

  async enrollMfa(userId: string): Promise<MfaEnrollResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const enrollment = await this.totpAdapter.generateEnrollment(
      user.email,
      'Slotly',
    );

    // Store pending secret temporarily in Redis for 10 minutes
    await this.cache.set(
      `slotly:pending_mfa:${userId}`,
      enrollment.secret,
      600,
    );

    return {
      secret: enrollment.secret,
      qrCodeUrl: enrollment.qrCodeUrl,
      recoveryCodes: enrollment.recoveryCodes,
    };
  }

  async verifyMfa(
    userId: string,
    dto: MfaVerifyDto,
  ): Promise<{ message: string }> {
    const pendingSecret = await this.cache.get<string>(
      `slotly:pending_mfa:${userId}`,
    );
    if (!pendingSecret) {
      throw new BadRequestException({
        code: 'MFA_SESSION_EXPIRED',
        message: 'MFA setup session expired. Please initiate enrollment again.',
      });
    }

    const isValid = this.totpAdapter.verifyCode(dto.code, pendingSecret);
    if (!isValid) {
      throw new BadRequestException({
        code: 'INVALID_MFA_CODE',
        message: 'Incorrect 6-digit code from authenticator app.',
      });
    }

    // Generate and hash recovery codes
    const recoveryCodes = this.totpAdapter.generateRecoveryCodes(8);
    const hashedCodes = recoveryCodes.map((c) =>
      this.totpAdapter.hashRecoveryCode(c),
    );

    await this.userRepo.update(userId, {
      mfaEnabled: true,
      mfaSecret: pendingSecret,
      recoveryCodes: hashedCodes,
    });

    await this.cache.del(`slotly:pending_mfa:${userId}`);
    await this.auditService.log('AUTH_MFA_ENABLED', userId, {
      type: 'user',
      id: userId,
    });

    return { message: 'Two-Factor Authentication is now enabled.' };
  }

  async disableMfa(userId: string): Promise<{ message: string }> {
    await this.userRepo.update(userId, {
      mfaEnabled: false,
      mfaSecret: undefined,
      recoveryCodes: [],
    });

    await this.auditService.log('AUTH_MFA_DISABLED', userId, {
      type: 'user',
      id: userId,
    });
    return { message: 'Two-Factor Authentication has been disabled.' };
  }

  async recoverMfa(
    dto: MfaRecoveryDto,
    meta: ClientMeta,
  ): Promise<{ response: AuthResponse; refreshToken?: string | undefined }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.mfaEnabled || user.recoveryCodes.length === 0) {
      throw new UnauthorizedException({
        code: 'INVALID_RECOVERY_CODE',
        message: 'Invalid recovery code or MFA is not enabled.',
      });
    }

    const inputHash = this.totpAdapter.hashRecoveryCode(dto.recoveryCode);
    const codeIndex = user.recoveryCodes.indexOf(inputHash);

    if (codeIndex === -1) {
      throw new UnauthorizedException({
        code: 'INVALID_RECOVERY_CODE',
        message: 'Invalid recovery code.',
      });
    }

    // Consume single-use recovery code
    const remaining = [...user.recoveryCodes];
    remaining.splice(codeIndex, 1);
    const userId =
      (user as unknown as { _id?: { toString(): string } })._id?.toString() ||
      user.email;
    await this.userRepo.update(userId, { recoveryCodes: remaining });

    const userDto = this.toUserDto(user);

    if (!user.institutionId && this.institutionRepo) {
      let firstInst = await this.institutionRepo.findOne({
        isDeleted: false,
      });
      if (!firstInst) {
        firstInst = await this.institutionRepo.create({
          name: 'Main Campus',
          code: 'MAIN',
          workingDays: [1, 2, 3, 4, 5],
          defaultPeriodConfig: {
            startTime: '09:00',
            periodDuration: 50,
            periodsPerDay: 7,
            breaks: [
              { name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 },
            ],
          },
          isComplete: true,
          isDeleted: false,
        });
      }
      if (firstInst) {
        const id = this.getEntityId(firstInst);
        if (id) {
          const instObjId = new Types.ObjectId(id);
          user.institutionId = instObjId;
          userDto.institutionId = id;
          const uId = this.getEntityId(user);
          if (uId) {
            await this.userRepo.update(uId, { institutionId: instObjId });
          }
        }
      }
    }
    const { accessToken, refreshToken } =
      await this.sessionsService.createSession(userDto.id, userDto.role, {
        institutionId: userDto.institutionId,
        device: meta.device,
        browser: meta.browser,
        ip: meta.ip,
        mfaVerified: true,
      });

    await this.auditService.log('AUTH_RECOVERY_COMPLETED', userDto.id, {
      type: 'user',
      id: userDto.id,
    });
    await this.emailAdapter.sendSecurityAlert(
      user.email,
      'Account Recovered via Emergency Code',
      {
        remainingCodes: remaining.length,
      },
    );

    return {
      response: {
        accessToken,
        user: userDto,
      },
      refreshToken,
    };
  }

  async stepUp(
    sessionId: string,
    userId: string,
    dto: StepUpDto,
  ): Promise<{ success: boolean; validUntil: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedException('User not found.');

    let verified = false;
    if (dto.password) {
      verified = await this.passwordPolicy.verify(
        user.passwordHash,
        dto.password,
      );
    } else if (dto.code && user.mfaSecret) {
      verified = this.totpAdapter.verifyCode(dto.code, user.mfaSecret);
    }

    if (!verified) {
      throw new UnauthorizedException({
        code: 'STEP_UP_FAILED',
        message: 'Invalid verification credentials for step-up authentication.',
      });
    }

    await this.sessionsService.setStepUp(sessionId, 600); // 10 minutes step-up validity
    const validUntil = new Date(Date.now() + 600000).toISOString();

    return { success: true, validUntil };
  }

  async googleOAuth(
    idToken: string,
    meta: ClientMeta,
  ): Promise<{ response: AuthResponse; refreshToken?: string | undefined }> {
    const profile = await this.oauthVerifier.verifyGoogleToken(idToken);
    let user = await this.userRepo.findByEmail(profile.email);

    if (!user) {
      const count = await this.userRepo.countByInstitution();
      const role: UserRole = count === 0 ? 'ADMIN' : 'DESIGNER';

      user = await this.userRepo.create({
        email: profile.email,
        name: profile.name,
        passwordHash: await this.passwordPolicy.hash(
          `oauth_pass_${randomBytes(16).toString('hex')}`,
        ),
        role,
        isEmailVerified: true,
        mfaEnabled: false,
        status: 'active',
      });
    }

    const userDto = this.toUserDto(user);

    if (!user.institutionId && this.institutionRepo) {
      let firstInst = await this.institutionRepo.findOne({
        isDeleted: false,
      });
      if (!firstInst) {
        firstInst = await this.institutionRepo.create({
          name: 'Main Campus',
          code: 'MAIN',
          workingDays: [1, 2, 3, 4, 5],
          defaultPeriodConfig: {
            startTime: '09:00',
            periodDuration: 50,
            periodsPerDay: 7,
            breaks: [
              { name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 },
            ],
          },
          isComplete: true,
          isDeleted: false,
        });
      }
      if (firstInst) {
        const id = this.getEntityId(firstInst);
        if (id) {
          const instObjId = new Types.ObjectId(id);
          user.institutionId = instObjId;
          userDto.institutionId = id;
          const uId = this.getEntityId(user);
          if (uId) {
            await this.userRepo.update(uId, { institutionId: instObjId });
          }
        }
      }
    }
    const { accessToken, refreshToken } =
      await this.sessionsService.createSession(userDto.id, userDto.role, {
        institutionId: userDto.institutionId,
        device: meta.device,
        browser: meta.browser,
        ip: meta.ip,
        mfaVerified: true,
      });

    return {
      response: {
        accessToken,
        user: userDto,
      },
      refreshToken,
    };
  }
}
