import { Global, Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthController } from './auth.controller';
import { DefaultAuthService } from './auth.service';
import { AUTH_SERVICE } from './auth.interface';
import {
  RedisSessionsService,
  SESSIONS_SERVICE,
} from './services/sessions.service';
import { RedisOtpService, OTP_SERVICE } from './services/otp.service';
import {
  RedisThrottlerService,
  THROTTLER_SERVICE,
} from './services/throttler.service';
import {
  CommonListPasswordChecker,
  BREACHED_PASSWORD_CHECKER,
} from './adapters/breached-password.adapter';
import {
  StandardPasswordPolicy,
  PASSWORD_POLICY,
} from './adapters/password-policy.adapter';
import { OtplibTotpAdapter, TOTP_ADAPTER } from './adapters/totp.adapter';
import { QueueEmailAdapter, EMAIL_ADAPTER } from './adapters/email.adapter';
import { GoogleOAuthVerifier, OAUTH_VERIFIER } from './adapters/oauth.adapter';
import { StandardAccessPolicy } from '../../common/rbac/permissions.guard';
import { ACCESS_POLICY } from '../../common/rbac/access-policy.interface';
import { AuthGuard } from './guards/auth.guard';
import { StepUpGuard } from './guards/step-up.guard';
import { PermissionsGuard } from '../../common/rbac/permissions.guard';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications' }),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    { provide: BREACHED_PASSWORD_CHECKER, useClass: CommonListPasswordChecker },
    { provide: PASSWORD_POLICY, useClass: StandardPasswordPolicy },
    { provide: TOTP_ADAPTER, useClass: OtplibTotpAdapter },
    { provide: EMAIL_ADAPTER, useClass: QueueEmailAdapter },
    { provide: OAUTH_VERIFIER, useClass: GoogleOAuthVerifier },
    { provide: ACCESS_POLICY, useClass: StandardAccessPolicy },
    { provide: SESSIONS_SERVICE, useClass: RedisSessionsService },
    { provide: OTP_SERVICE, useClass: RedisOtpService },
    { provide: THROTTLER_SERVICE, useClass: RedisThrottlerService },
    { provide: AUTH_SERVICE, useClass: DefaultAuthService },
    AuthGuard,
    StepUpGuard,
    PermissionsGuard,
  ],
  exports: [
    AUTH_SERVICE,
    SESSIONS_SERVICE,
    OTP_SERVICE,
    THROTTLER_SERVICE,
    PASSWORD_POLICY,
    TOTP_ADAPTER,
    EMAIL_ADAPTER,
    OAUTH_VERIFIER,
    ACCESS_POLICY,
    AuthGuard,
    StepUpGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
