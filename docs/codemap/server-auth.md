# Server Auth Module Code Map

### `server/src/modules/auth/adapters/breached-password.adapter.ts`
*Core implementation for breached-password.adapter in server/src/modules/auth/adapters.*

- **Injectable** `CommonListPasswordChecker` implements `BreachedPasswordChecker` - Injectable service providing common list password checker logic.
- **Interface** `BreachedPasswordChecker` - Interface defining structure for breached password checker.
- **Const** `BREACHED_PASSWORD_CHECKER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing breached password checker.

### `server/src/modules/auth/adapters/email.adapter.ts`
*Core implementation for email.adapter in server/src/modules/auth/adapters.*

- **Injectable** `QueueEmailAdapter` implements `EmailAdapter` (deps: EmailService) - Injectable service providing queue email adapter logic.
- **Interface** `EmailAdapter` - Interface defining structure for email adapter.
- **Const** `EMAIL_ADAPTER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing email adapter.

### `server/src/modules/auth/adapters/oauth.adapter.ts`
*Core implementation for oauth.adapter in server/src/modules/auth/adapters.*

- **Injectable** `GoogleOAuthVerifier` implements `OAuthVerifier` - Injectable service providing google o auth verifier logic.
- **Interface** `OAuthUserProfile` - Interface defining structure for o auth user profile.
- **Interface** `OAuthVerifier` - Interface defining structure for o auth verifier.
- **Const** `OAUTH_VERIFIER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing oauth verifier.

### `server/src/modules/auth/adapters/password-policy.adapter.ts`
*Core implementation for password-policy.adapter in server/src/modules/auth/adapters.*

- **Injectable** `StandardPasswordPolicy` implements `PasswordPolicy` (deps: @Inject(BREACHED_PASSWORD_CHECKER)) - Injectable service providing standard password policy logic.
- **Interface** `PasswordPolicy` - Interface defining structure for password policy.
- **Const** `PASSWORD_POLICY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing password policy.

### `server/src/modules/auth/adapters/totp.adapter.ts`
*Core implementation for totp.adapter in server/src/modules/auth/adapters.*

- **Injectable** `OtplibTotpAdapter` implements `TotpAdapter` - Injectable service providing otplib totp adapter logic.
- **Interface** `TotpEnrollment` - Interface defining structure for totp enrollment.
- **Interface** `TotpAdapter` - Interface defining structure for totp adapter.
- **Const** `TOTP_ADAPTER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing totp adapter.

### `server/src/modules/auth/auth.controller.ts`
*HTTP controller handling auth.controller endpoints.*

- **Controller** `AuthController` (base: `/auth`) - Controller handling auth controller HTTP endpoints.
  - `POST /auth/register` -> `register()` [public]
  - `POST /auth/login` -> `login()` [public]
  - `POST /auth/logout` -> `logout()` [guards: AuthGuard]
  - `POST /auth/logout-all` -> `logoutAll()` [guards: AuthGuard]
  - `POST /auth/refresh` -> `refresh()` [public]
  - `POST /auth/revoke` -> `revoke()` [guards: AuthGuard]
  - `POST /auth/email/verify` -> `verifyEmail()` [public]
  - `POST /auth/email/resend` -> `resendEmail()` [public]
  - `POST /auth/password/forgot` -> `forgotPassword()` [public]
  - `POST /auth/password/reset` -> `resetPassword()` [public]
  - `PATCH /auth/password` -> `changePassword()` [guards: AuthGuard]
  - `GET /auth/sessions` -> `listSessions()` [guards: AuthGuard]
  - `GET /auth/sessions/:sessionId` -> `getSession()` [guards: AuthGuard]
  - `DELETE /auth/sessions/:sessionId` -> `revokeOneSession()` [guards: AuthGuard]
  - `DELETE /auth/sessions` -> `revokeOtherSessions()` [guards: AuthGuard]
  - `POST /auth/mfa/enroll` -> `enrollMfa()` [guards: AuthGuard]
  - `POST /auth/mfa/verify` -> `verifyMfa()` [guards: AuthGuard]
  - `POST /auth/mfa/enable` -> `enableMfa()` [guards: AuthGuard]
  - `POST /auth/mfa/disable` -> `disableMfa()` [guards: AuthGuard, StepUpGuard]
  - `DELETE /auth/mfa` -> `deleteMfa()` [guards: AuthGuard, StepUpGuard]
  - `POST /auth/mfa/recovery` -> `recoverMfa()` [public]
  - `POST /auth/step-up` -> `stepUp()` [guards: AuthGuard]
  - `POST /auth/oauth/google` -> `googleOAuth()` [public]

### `server/src/modules/auth/auth.interface.ts`
*Core implementation for auth.interface in server/src/modules/auth.*

- **Interface** `ClientMeta` - Interface defining structure for client meta.
- **Interface** `AuthService` - Interface defining structure for auth service.
- **Const** `AUTH_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing auth service.

### `server/src/modules/auth/auth.module.ts`
*Core implementation for auth.module in server/src/modules/auth.*

- **Class** `AuthModule` - Class implementing auth module.

### `server/src/modules/auth/auth.service.ts`
*Domain service orchestrating auth.service business logic.*

- **Injectable** `DefaultAuthService` implements `AuthService` (deps: @Inject(USER_REPOSITORY), @Inject(SESSIONS_SERVICE), @Inject(OTP_SERVICE), @Inject(THROTTLER_SERVICE), @Inject(PASSWORD_POLICY), @Inject(TOTP_ADAPTER), @Inject(EMAIL_ADAPTER), @Inject(OAUTH_VERIFIER), @Inject(CACHE_SERVICE), AuditService, @Inject(INSTITUTION_REPOSITORY)) - Injectable service providing default auth service logic.

### `server/src/modules/auth/guards/auth.guard.ts`
*Route guard controlling access for auth.guard.*

- **Injectable** `AuthGuard` implements `CanActivate` (deps: Reflector, @Inject(SESSIONS_SERVICE), @Inject(USER_REPOSITORY), @Inject(INSTITUTION_REPOSITORY), @Inject(jwtConfig.KEY)) - Injectable service providing auth guard logic.
- **Interface** `RequestUser` - Interface defining structure for request user.

### `server/src/modules/auth/guards/public.decorator.ts`
*Route guard controlling access for public.decorator.*

- **Const** `IS_PUBLIC_KEY`: `"isPublic"` - Constant representing s public key.
- **Component** `Public()` - React component rendering public.

### `server/src/modules/auth/guards/step-up.guard.ts`
*Route guard controlling access for step-up.guard.*

- **Injectable** `StepUpGuard` implements `CanActivate` (deps: @Inject(SESSIONS_SERVICE)) - Injectable service providing step up guard logic.
- **Const** `REQUIRE_STEP_UP_KEY`: `"requireStepUp"` - Constant representing require step up key.

### `server/src/modules/auth/services/otp.service.ts`
*Domain service orchestrating otp.service business logic.*

- **Injectable** `RedisOtpService` implements `OtpService` (deps: @Inject(CACHE_SERVICE), @Inject(authConfig.KEY)) - Injectable service providing redis otp service logic.
- **Interface** `OtpRecord` - Interface defining structure for otp record.
- **Interface** `OtpService` - Interface defining structure for otp service.
- **Const** `OTP_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing otp service.

### `server/src/modules/auth/services/sessions.service.ts`
*Domain service orchestrating sessions.service business logic.*

- **Injectable** `RedisSessionsService` implements `SessionsService` (deps: @Inject(CACHE_SERVICE), @Inject(jwtConfig.KEY), @Inject(sessionConfig.KEY)) - Injectable service providing redis sessions service logic.
- **Interface** `SessionData` - Interface defining structure for session data.
- **Interface** `RotatedTokens` - Interface defining structure for rotated tokens.
- **Interface** `SessionsService` - Interface defining structure for sessions service.
- **Const** `SESSIONS_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing sessions service.

### `server/src/modules/auth/services/throttler.service.ts`
*Domain service orchestrating throttler.service business logic.*

- **Injectable** `RedisThrottlerService` implements `ThrottlerService` (deps: @Inject(CACHE_SERVICE)) - Injectable service providing redis throttler service logic.
- **Interface** `ThrottlerService` - Interface defining structure for throttler service.
- **Const** `THROTTLER_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing throttler service.

