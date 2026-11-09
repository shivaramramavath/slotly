# Auth Verification and Refresh Flow

Status: Part A (verify and harden the refresh flow) is done and merged into the working branch history recorded in `docs/PROGRESS.md`. Part B (client route protection: route access registry, RouteGuard, auth state machine, optional edge hint) is planned. Social login (Google, GitHub) and email-OTP step-up are built. Items marked **(verify)** must be checked against the code.

## 1. Flow map

```
CLIENT
  AuthProvider        calls POST /auth/refresh once on application mount (single flight)
  apiClient           attaches the in-memory Bearer access token; on 401 (except /auth/login,
                      /auth/register, /auth/refresh) runs one shared refresh, then replays the
                      original request once and validates the replay status
  cross-tab-sync      Web Locks (navigator.locks 'slotly_refresh_lock') serializes refresh across
                      tabs; BroadcastChannel 'slotly_auth_sync' broadcasts token_refreshed, login,
                      logout (timestamps only, never tokens)
  token-refresher     reads the JWT exp, schedules a refresh about 60 s before expiry, pauses while
                      the tab is hidden, checks on visibilitychange and the online event
  logout-registry     Observer: features register cleanup (query cache, stores, sockets, timers);
                      runs on logout, definitive refresh failure and user change
  sockets             handshake auth callback reads the current in-memory token on every connect;
                      one retry after a refresh on a handshake auth error

SERVER
  CORS                exact origin (CLIENT_URL) with credentials on HTTP and on the /blueprint,
                      /builds and /schedule namespaces
  POST /auth/refresh  per-IP throttle (30 per minute); reads httpOnly cookie 'refreshToken';
                      token format s_<sessionId>_<64 hex chars>; sessionId parsed with
                      parts.slice(1, -1).join('_') so underscored ids work
  rotation            validates the Redis session (active, within max lifetime), compares the hash
                      with the current refresh token, rotates atomically, updates lastActiveAt and
                      the inactivity TTL, signs a new 15-minute access token
  grace window        a just-rotated token presented again within 10 s receives the same new
                      credentials (concurrent tabs); presented after 10 s it is treated as reuse
  reuse detection     after the grace window, the whole token family is revoked, a security audit
                      event is written and an alert email is queued
  every request       AuthGuard validates the access token AND the Redis session, so revocation is
                      immediate; socket handshakes do the same
```

## 2. Cookie and CORS audit (final state)

| Property | Value | Assessment |
|---|---|---|
| Name | `refreshToken` | Fine |
| HttpOnly | true | Not readable from JavaScript |
| Secure | true when `NODE_ENV` is production | Fine; allows local HTTP development |
| SameSite | Lax | Balances CSRF protection with OAuth top-level redirects |
| Path | `/auth` | Resolved: the cookie is sent only to refresh and logout routes, not to every API route |
| Max-Age | 2592000 s (30 days) per the progress log **(verify)** | An earlier draft of this document said 7 days. The server enforces a 7-day inactivity timeout and a 30-day maximum lifetime, so the cookie may outlive an inactive session but never extends it. Confirm the code and keep this table and `docs/PROGRESS.md` consistent |
| Domain | omitted (host-only) | Prevents subdomain leaks |
| HTTP CORS | exact `CLIENT_URL`, credentials true | Fine |
| WebSocket CORS | exact `CLIENT_URL` | Resolved (was `origin: '*'` with credentials). **(verify)** the value is read through the config layer and not by direct `process.env` access in the gateway decorators, which the lint rule forbids outside `src/config` |

Session limits: access token 15 minutes, session inactivity timeout 7 days, maximum lifetime 30 days, step-up window 10 minutes, refresh throttle 30 per minute per IP.

## 3. Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| R1 | S1 | Refresh token format mismatch between controller (`s_<sessionId>_<random>`) and sessions service (`rt_<random>`) made every refresh fail | Resolved, one format everywhere |
| R2 | S1 | Concurrent multi-tab refresh falsely triggered reuse detection and revoked the whole session | Resolved by the 10-second grace window |
| R3 | S2 | WebSocket CORS wildcard with credentials on blueprint and builds gateways | Resolved (see the verify note above); the schedule gateway must follow the same rule |
| R4 | S2 | apiClient looped on `/auth/register`, did not check replayed responses, and treated transient refresh failures as logout | Resolved |
| R5 | S3 | No throttling on `POST /auth/refresh` | Resolved (30 per minute per IP) |
| R6 | S3 | Access tokens are signed with `createHash('sha256')` over `header.payload.secret` instead of HMAC (audit finding AUD-A-07: `sessions.service.ts` and `auth.guard.ts`) | **Open**. Replace with `createHmac('sha256', secret)` or a standard JWT library, keep a short transition period that accepts both, and add tests |
| R7 | S3 | Client route protection is not yet centralized (no route access registry or RouteGuard) | **Open**, Part B |

## 4. Additions since the first version

- **Step-up** accepts password, TOTP or a fresh email OTP (`POST /auth/step-up`, `POST /auth/step-up/email/send`), so accounts with no password and no MFA can still do sensitive actions.
- **Social login** uses the server-side authorization code flow (`GET /auth/oauth/providers`, `/auth/oauth/:provider/start`, `/auth/oauth/:provider/callback`) with state, a binding cookie, PKCE where supported and a nonce; only verified provider emails are trusted; MFA is never skipped; provider tokens are not stored; accounts are linked or created by the rules in `docs/ARCHITECTURE.md` Section 5.3; `POST /auth/onboarding` completes institution setup for new social users; connected accounts are managed under `/users/me/security/connections` (disconnect needs step-up and is blocked when it would remove the last sign-in method).
- **Configuration** for all of the above comes from the `auth`, `session`, `jwt` and `oauth` namespaces (`docs/ARCHITECTURE.md` Section 9).

## 5. Tests

Server (`server/src/modules/auth/tests/refresh-flow.spec.ts`, 10 scenarios): refresh success and rotation; 10 parallel refreshes inside the grace window; reuse after the window revokes the family; malformed, expired, tampered and missing cookies; session revocation on password change; inactivity timeout and maximum lifetime; MFA-pending cannot refresh; logout and logout-all; throttling; response headers and CORS. Plus `token-rotation.spec.ts` and the OAuth, step-up and RBAC suites.

Client (`api-client.spec.ts`, 5 tests, and `token-storage.spec.ts`): single flight for concurrent 401s; no loops on login, register or refresh; network and 5xx errors do not log out; step-up 403 is not a session expiry; a definitive 401 on refresh clears state once. The storage test scans client sources for token persistence in localStorage or sessionStorage.

Still to add for Part B: route access registry coverage test, RouteGuard state tests, `sanitizeNext` attack-string tests, forged-hint test, and the nine Playwright scenarios from the protected-routes prompt.

## 6. Part B design (planned)

- Auth state machine in the store: idle, restoring, authenticated, unauthenticated, mfaPending, needsVerification, needsOnboarding.
- `lib/route-access.ts` registry mapping route patterns to public, guestOnly, authenticated, role or permission, and state-restricted policies; one source for the guard, navigation, command palette and redirects; a test fails when a route file has no policy.
- RouteGuard in the `(auth)` and `(app)` layouts: renders only a skeleton while idle or restoring; never renders protected children or cached data before authentication resolves; redirects once per navigation; `sanitizeNext` allows relative in-app paths only.
- Optional edge hint cookie `slotly_session_hint` read by `proxy.ts` (or `middleware.ts`, depending on the Next.js version): a convenience for early redirects, never trusted. Forging it must grant no data.

## 7. Manual checklist

1. DevTools, Application, Cookies: `refreshToken` shows HttpOnly, Path `/auth`, SameSite Lax (and Secure in production).
2. Temporarily set a short access-token lifetime in a test environment, stay on a page, and watch Network: one refresh request per expiry and no logout.
3. Open two tabs, sign out in one: the other signs out within about a second.
4. Replay an old refresh cookie after more than 10 seconds on a throwaway account: the account is signed out everywhere and a security alert is recorded.
5. Stop the API briefly during a refresh: the user stays signed in and sees a retryable state.
6. Confirm no token appears in localStorage, sessionStorage, URLs or logs.