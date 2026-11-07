# Server Auth Module Code Map

### `server/src/modules/auth/adapters/breached-password.adapter.ts`
*(no description)*

- **Injectable** `CommonListPasswordChecker` implements `BreachedPasswordChecker`
- **Interface** `BreachedPasswordChecker`
- **Const** `BREACHED_PASSWORD_CHECKER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/auth/adapters/email.adapter.ts`
*(no description)*

- **Injectable** `QueueEmailAdapter` implements `EmailAdapter` (deps: EmailService)
- **Interface** `EmailAdapter`
- **Const** `EMAIL_ADAPTER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/auth/adapters/oauth.adapter.ts`
*(no description)*

- **Injectable** `GoogleOAuthVerifier` implements `OAuthVerifier`
- **Interface** `OAuthUserProfile`
- **Interface** `OAuthVerifier`
- **Const** `OAUTH_VERIFIER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/auth/adapters/password-policy.adapter.ts`
*(no description)*

- **Injectable** `StandardPasswordPolicy` implements `PasswordPolicy` (deps: @Inject(BREACHED_PASSWORD_CHECKER))
- **Interface** `PasswordPolicy`
- **Const** `PASSWORD_POLICY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/auth/adapters/totp.adapter.ts`
*(no description)*

- **Injectable** `OtplibTotpAdapter` implements `TotpAdapter`
- **Interface** `TotpEnrollment`
- **Interface** `TotpAdapter`
- **Const** `TOTP_ADAPTER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/auth/auth.controller.ts`
*(no description)*

- **Controller** `AuthController` (base: `/auth`)
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
*(no description)*

- **Interface** `ClientMeta`
- **Interface** `AuthService`
- **Const** `AUTH_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/auth/auth.module.ts`
*(no description)*

- **Class** `AuthModule`

### `server/src/modules/auth/auth.service.ts`
*(no description)*

- **Injectable** `DefaultAuthService` implements `AuthService` (deps: @Inject(USER_REPOSITORY), @Inject(SESSIONS_SERVICE), @Inject(OTP_SERVICE), @Inject(THROTTLER_SERVICE), @Inject(PASSWORD_POLICY), @Inject(TOTP_ADAPTER), @Inject(EMAIL_ADAPTER), @Inject(OAUTH_VERIFIER), @Inject(CACHE_SERVICE), AuditService, @Inject(INSTITUTION_REPOSITORY))

### `server/src/modules/auth/guards/auth.guard.ts`
*(no description)*

- **Injectable** `AuthGuard` implements `CanActivate` (deps: Reflector, @Inject(SESSIONS_SERVICE), @Inject(USER_REPOSITORY))
- **Interface** `RequestUser`

### `server/src/modules/auth/guards/public.decorator.ts`
*(no description)*

- **Const** `IS_PUBLIC_KEY`: `"isPublic"`
- **Component** `Public()`

### `server/src/modules/auth/guards/step-up.guard.ts`
*(no description)*

- **Injectable** `StepUpGuard` implements `CanActivate` (deps: @Inject(SESSIONS_SERVICE))
- **Const** `REQUIRE_STEP_UP_KEY`: `"requireStepUp"`

### `server/src/modules/auth/services/otp.service.ts`
*(no description)*

- **Injectable** `RedisOtpService` implements `OtpService` (deps: @Inject(CACHE_SERVICE))
- **Interface** `OtpRecord`
- **Interface** `OtpService`
- **Const** `OTP_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/auth/services/sessions.service.ts`
*(no description)*

- **Injectable** `RedisSessionsService` implements `SessionsService` (deps: @Inject(CACHE_SERVICE))
- **Interface** `SessionData`
- **Interface** `RotatedTokens`
- **Interface** `SessionsService`
- **Const** `SESSIONS_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/auth/services/throttler.service.ts`
*(no description)*

- **Injectable** `RedisThrottlerService` implements `ThrottlerService` (deps: @Inject(CACHE_SERVICE))
- **Interface** `ThrottlerService`
- **Const** `THROTTLER_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

