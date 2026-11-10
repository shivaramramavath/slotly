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

### `server/src/modules/auth/adapters/http-client.adapter.ts`
*Network HTTP client adapter providing injectable request abstraction for OAuth providers.*

- **Injectable** `FetchHttpClient` implements `HttpClient` - Default implementation of HttpClient using native fetch.
- **Interface** `HttpClient` - Interface defining minimal HTTP client operations.
- **Const** `HTTP_CLIENT`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Dependency injection token for HTTP client adapter.

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
  - `POST /auth/refresh` -> `refresh()` [public]
  - `POST /auth/email/verify` -> `verifyEmail()` [public]
  - `POST /auth/email/resend` -> `resendVerificationEmail()` [public]
  - `POST /auth/password/forgot` -> `forgotPassword()` [public]
  - `POST /auth/password/reset` -> `resetPassword()` [public]
  - `PATCH /auth/password` -> `changePassword()` [guards: AuthGuard, StepUpGuard]
  - `GET /auth/sessions` -> `listSessions()` [guards: AuthGuard]
  - `GET /auth/sessions/:sessionId` -> `getSessionStatus()` [public]
  - `DELETE /auth/sessions/:sessionId` -> `revokeSession()` [guards: AuthGuard]
  - `DELETE /auth/sessions` -> `revokeAllOtherSessions()` [guards: AuthGuard]
  - `POST /auth/mfa/enroll` -> `enrollMfa()` [guards: AuthGuard, StepUpGuard]
  - `POST /auth/mfa/verify` -> `verifyMfa()` [guards: AuthGuard]
  - `POST /auth/mfa/disable` -> `disableMfa()` [guards: AuthGuard, StepUpGuard]
  - `POST /auth/mfa/recovery` -> `recoverMfa()` [public]
  - `POST /auth/step-up` -> `stepUp()` [guards: AuthGuard]
  - `POST /auth/step-up/email/send` -> `sendStepUpEmailOtp()` [guards: AuthGuard]
  - `GET /auth/oauth/providers` -> `listOAuthProviders()` [public]
  - `GET /auth/oauth/:provider/start` -> `startOAuth()` [public]
  - `GET /auth/oauth/:provider/callback` -> `oAuthCallback()` [public]
  - `POST /auth/onboarding` -> `completeOnboarding()` [guards: AuthGuard]
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

### `server/src/modules/auth/repositories/oauth-identity.repository.ts`
*Database repository managing persistence and queries for OAuthIdentity entities.*

- **Injectable** `MongoOAuthIdentityRepository` implements `OAuthIdentityRepository` (deps: ObjectId; }> & { __v: number; }>) - Mongoose implementation of OAuthIdentityRepository.
- **Interface** `OAuthIdentityRepository` extends `BaseRepository<OAuthIdentity>` - Interface defining repository queries for OAuth identity links.
- **Const** `OAUTH_IDENTITY_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Dependency injection token for OAuthIdentity repository.

### `server/src/modules/auth/schemas/oauth-identity.schema.ts`
*Mongoose schema definition for third-party OAuth provider identities.*

- **Mongoose Schema** `OAuthIdentity` (collection: `oauth_identities` (indexes: userId)) - Entity representing a connected third-party OAuth identity linked to a user.
- **Type** `OAuthIdentityDocument` - Mongoose document type for OAuthIdentity.
- **Zod Schema** `OAuthIdentitySchema` -> `OAuthIdentity` - Factory-generated schema for OAuthIdentity with compound unique and query indexes.

### `server/src/modules/auth/services/account-linking.service.ts`
*Pure state-machine deciding account linking, login, signup, and pre-hijack takeover actions.*

- **Injectable** `AccountLinkingService` - Pure domain service evaluating OAuth account resolution logic.
- **Interface** `LinkingUserCandidate` - User context passed into account linking evaluation.
- **Interface** `ExistingOAuthIdentity` - Existing OAuth link record found in database.
- **Interface** `AccountLinkingInput` - Input parameters evaluated by the account linking engine.
- **Type** `AccountLinkingDecision` - Distinct decisions emitted by the account linking engine.

### `server/src/modules/auth/services/auth-session.service.ts`
*Domain service orchestrating session creation, device registration, and login audit emission.*

- **Injectable** `AuthSessionService` (deps: @Inject(SESSIONS_SERVICE), AuditService, @Inject(EMAIL_ADAPTER), @Inject(USER_REPOSITORY)) - Injectable service coordinating session issuance and device logging.
- **Interface** `ClientMeta` - Client metadata extracted from HTTP request.
- **Interface** `IssueSessionResult` - Result of issuing an authenticated session.
- **Interface** `IssueSessionOptions` - Options configuring session issuance.
- **Const** `AUTH_SESSION_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing auth session service dependency injection token.

### `server/src/modules/auth/services/oauth-state.service.ts`
*Service managing OAuth state, PKCE code challenges, and CSRF binding secrets in cache.*

- **Injectable** `OAuthStateService` (deps: @Inject(CACHE_SERVICE)) - Service managing transient OAuth state and CSRF validation.
- **Interface** `OAuthStatePayload` - State payload preserved across OAuth redirect cycles.

### `server/src/modules/auth/services/oauth.service.ts`
*Orchestration service managing OAuth flows, account linking, onboarding, and connection lifecycles.*

- **Injectable** `OAuthService` (deps: string, OAuthProviderRegistry, OAuthStateService, AccountLinkingService, @Inject(OAUTH_IDENTITY_REPOSITORY), @Inject(USER_REPOSITORY), @Inject(INSTITUTION_REPOSITORY), AuthSessionService, @Inject(SESSIONS_SERVICE), @Inject(EMAIL_ADAPTER), AuditService) - Service managing OAuth provider authentication and connection operations.
- **Interface** `StartOAuthResult` - Result returned after initiating an OAuth authorization flow.
- **Interface** `HandleCallbackResult` - Result returned after processing an OAuth redirect callback.

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

### `server/src/modules/auth/strategies/github.provider.ts`
*GitHub OAuth 2.0 authentication strategy.*

- **Injectable** `GithubProvider` implements `OAuthProvider` (deps: @Inject(GITHUB_PROVIDER_CONFIG), @Inject(HTTP_CLIENT)) - Implementation of GitHub OAuth 2.0 provider strategy.
- **Const** `GITHUB_PROVIDER_CONFIG`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Dependency injection token for GitHub provider configuration.

### `server/src/modules/auth/strategies/google.provider.ts`
*Google OAuth 2.0 and OpenID Connect authentication strategy.*

- **Injectable** `GoogleProvider` implements `OAuthProvider` (deps: @Inject(GOOGLE_PROVIDER_CONFIG), @Inject(HTTP_CLIENT)) - Implementation of Google OAuth 2.0 provider strategy.
- **Const** `GOOGLE_PROVIDER_CONFIG`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Dependency injection token for Google provider configuration.

### `server/src/modules/auth/strategies/oauth-provider.interface.ts`
*OAuth provider abstraction and identity contract for third-party authentication strategies.*

- **Interface** `ProviderIdentity` - Standardized identity returned by an OAuth provider after code exchange.
- **Interface** `AuthorizationUrlParams` - Parameters required to generate an authorization URL.
- **Interface** `ExchangeCodeParams` - Parameters required to exchange an authorization code for an identity.
- **Interface** `OAuthProvider` - Contract implemented by third-party OAuth provider strategies.

### `server/src/modules/auth/strategies/oauth-provider.registry.ts`
*Registry holding configured OAuth provider strategies following Open/Closed principle.*

- **Injectable** `OAuthProviderRegistry` (deps: GoogleProvider, GithubProvider) - Registry maintaining supported OAuth provider implementations.

### `server/src/modules/auth/types/oauth.types.ts`
*Types and configuration models for OAuth strategies and state management.*

- **Interface** `GoogleProviderConfig` - Configuration options for Google OAuth strategy.
- **Interface** `GithubProviderConfig` - Configuration options for GitHub OAuth strategy.
- **Interface** `CreateOAuthStateParams` - Parameters required to initiate a new OAuth state challenge.
- **Interface** `CreateOAuthStateResult` - Result returned after generating and persisting an OAuth state.

### `server/src/modules/auth/utils/redirect-sanitizer.ts`
*Utility for sanitizing post-authentication redirect targets to prevent open redirect vulnerabilities.*

- **Function** `sanitizeNext(next: unknown)`: `string` - Validates and sanitizes a post-auth redirect path ensuring it is strictly relative.

