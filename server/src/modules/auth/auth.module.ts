// Core implementation for auth.module in server/src/modules/auth.
import { Global, Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../common/audit/audit.service';
import { INSTITUTION_REPOSITORY } from '../institutions/repositories/institution.repository';
import type { InstitutionRepository } from '../institutions/repositories/institution.repository';
import { USER_REPOSITORY } from '../users/repositories/user.repository';
import type { UserRepository } from '../users/repositories/user.repository';
import { AuthController } from './auth.controller';
import { DefaultAuthService } from './auth.service';
import { AUTH_SERVICE } from './auth.interface';
import {
  RedisSessionsService,
  SESSIONS_SERVICE,
} from './services/sessions.service';
import type { SessionsService } from './services/sessions.service';
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
import type { EmailAdapter } from './adapters/email.adapter';
import { GoogleOAuthVerifier, OAUTH_VERIFIER } from './adapters/oauth.adapter';
import { FetchHttpClient, HTTP_CLIENT } from './adapters/http-client.adapter';
import { StandardAccessPolicy } from '../../common/rbac/permissions.guard';
import { ACCESS_POLICY } from '../../common/rbac/access-policy.interface';
import { AuthGuard } from './guards/auth.guard';
import { StepUpGuard } from './guards/step-up.guard';
import { PermissionsGuard } from '../../common/rbac/permissions.guard';
import {
  AuthSessionService,
  AUTH_SESSION_SERVICE,
} from './services/auth-session.service';
import { UsersModule } from '../users/users.module';
import { InstitutionsModule } from '../institutions/institutions.module';
import {
  OAuthIdentity,
  OAuthIdentitySchema,
} from './schemas/oauth-identity.schema';
import {
  MongoOAuthIdentityRepository,
  OAUTH_IDENTITY_REPOSITORY,
} from './repositories/oauth-identity.repository';
import type { OAuthIdentityRepository } from './repositories/oauth-identity.repository';
import {
  GoogleProvider,
  GOOGLE_PROVIDER_CONFIG,
  GoogleProviderConfig,
} from './strategies/google.provider';
import {
  GithubProvider,
  GITHUB_PROVIDER_CONFIG,
  GithubProviderConfig,
} from './strategies/github.provider';
import { OAuthProviderRegistry } from './strategies/oauth-provider.registry';
import { OAuthStateService } from './services/oauth-state.service';
import { AccountLinkingService } from './services/account-linking.service';
import { OAuthService } from './services/oauth.service';

/** Class implementing auth module. */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OAuthIdentity.name, schema: OAuthIdentitySchema },
    ]),
    BullModule.registerQueue({ name: 'notifications' }),
    forwardRef(() => UsersModule),
    forwardRef(() => InstitutionsModule),
  ],
  controllers: [AuthController],
  providers: [
    { provide: BREACHED_PASSWORD_CHECKER, useClass: CommonListPasswordChecker },
    { provide: PASSWORD_POLICY, useClass: StandardPasswordPolicy },
    { provide: TOTP_ADAPTER, useClass: OtplibTotpAdapter },
    { provide: EMAIL_ADAPTER, useClass: QueueEmailAdapter },
    { provide: OAUTH_VERIFIER, useClass: GoogleOAuthVerifier },
    { provide: HTTP_CLIENT, useClass: FetchHttpClient },
    { provide: ACCESS_POLICY, useClass: StandardAccessPolicy },
    { provide: SESSIONS_SERVICE, useClass: RedisSessionsService },
    { provide: OTP_SERVICE, useClass: RedisOtpService },
    { provide: THROTTLER_SERVICE, useClass: RedisThrottlerService },
    { provide: AUTH_SERVICE, useClass: DefaultAuthService },
    AuthSessionService,
    { provide: AUTH_SESSION_SERVICE, useExisting: AuthSessionService },
    {
      provide: GOOGLE_PROVIDER_CONFIG,
      useFactory: (config: ConfigService): GoogleProviderConfig => ({
        clientId: config.get<string>('GOOGLE_CLIENT_ID') || '',
        clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || '',
        authUrl: config.get<string>('GOOGLE_AUTH_URL'),
        tokenUrl: config.get<string>('GOOGLE_TOKEN_URL'),
        userinfoUrl: config.get<string>('GOOGLE_USERINFO_URL'),
        expectedIssuer: config.get<string>('GOOGLE_EXPECTED_ISSUER'),
      }),
      inject: [ConfigService],
    },
    {
      provide: GITHUB_PROVIDER_CONFIG,
      useFactory: (config: ConfigService): GithubProviderConfig => ({
        clientId: config.get<string>('GITHUB_CLIENT_ID') || '',
        clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') || '',
        authUrl: config.get<string>('GITHUB_AUTH_URL'),
        tokenUrl: config.get<string>('GITHUB_TOKEN_URL'),
        userUrl: config.get<string>('GITHUB_USERINFO_URL'),
        emailsUrl: config.get<string>('GITHUB_EMAILS_URL'),
      }),
      inject: [ConfigService],
    },
    GoogleProvider,
    GithubProvider,
    OAuthProviderRegistry,
    OAuthStateService,
    AccountLinkingService,
    MongoOAuthIdentityRepository,
    {
      provide: OAUTH_IDENTITY_REPOSITORY,
      useExisting: MongoOAuthIdentityRepository,
    },
    {
      provide: OAuthService,
      useFactory: (
        config: ConfigService,
        registry: OAuthProviderRegistry,
        stateService: OAuthStateService,
        linkingService: AccountLinkingService,
        identityRepo: OAuthIdentityRepository,
        userRepo: UserRepository,
        institutionRepo: InstitutionRepository,
        authSessionService: AuthSessionService,
        sessionsService: SessionsService,
        emailAdapter: EmailAdapter,
        auditService: AuditService,
      ) => {
        return new OAuthService(
          config.get<string>('OAUTH_CALLBACK_BASE_URL') ||
            'http://localhost:4000',
          registry,
          stateService,
          linkingService,
          identityRepo,
          userRepo,
          institutionRepo,
          authSessionService,
          sessionsService,
          emailAdapter,
          auditService,
        );
      },
      inject: [
        ConfigService,
        OAuthProviderRegistry,
        OAuthStateService,
        AccountLinkingService,
        OAUTH_IDENTITY_REPOSITORY,
        USER_REPOSITORY,
        INSTITUTION_REPOSITORY,
        AuthSessionService,
        SESSIONS_SERVICE,
        EMAIL_ADAPTER,
        AuditService,
      ],
    },
    AuthGuard,
    StepUpGuard,
    PermissionsGuard,
  ],
  exports: [
    AUTH_SERVICE,
    AUTH_SESSION_SERVICE,
    AuthSessionService,
    SESSIONS_SERVICE,
    OTP_SERVICE,
    THROTTLER_SERVICE,
    PASSWORD_POLICY,
    TOTP_ADAPTER,
    EMAIL_ADAPTER,
    OAUTH_VERIFIER,
    ACCESS_POLICY,
    HTTP_CLIENT,
    OAUTH_IDENTITY_REPOSITORY,
    OAuthProviderRegistry,
    OAuthStateService,
    AccountLinkingService,
    OAuthService,
    AuthGuard,
    StepUpGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
