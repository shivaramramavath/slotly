# Auth Verification & Refresh Flow Hardening

## 1. Flow Architecture Map

```
+-----------------------------------------------------------------------------------------+
|                                      CLIENT LAYER                                       |
|                                                                                         |
|  [AuthProvider]                                                                         |
|      |                                                                                  |
|      +--> Calls authApi.refresh() on initial application mount                          |
|                                                                                         |
|  [apiClient]                                                                            |
|      |                                                                                  |
|      +--> Attaches Bearer memoryAccessToken to request headers                          |
|      +--> Intercepts 401 Unauthorized responses (excluding /auth/* routes)              |
|      +--> Single-flights concurrent 401s via in-flight refresh Promise & queue          |
|      +--> Replays original requests with fresh access token                             |
|      +--> Defers to Cross-Tab Lock (Web Locks API / BroadcastChannel)                   |
|                                                                                         |
|  [Proactive Refresher]                                                                  |
|      |                                                                                  |
|      +--> Reads JWT exp claim, schedules refresh at ~60s before expiry                 |
|      +--> Suspends on tab visibility hidden; fires on visibilitychange / online         |
|                                                                                         |
|  [Logout Cleanup Registry (Observer)]                                                   |
|      |                                                                                  |
|      +--> Notifies feature subscribers (React Query cache, zustand stores, sockets)    |
|      +--> Evicts all cached user & organization data upon sign-out or session expiry   |
+-----------------------------------------------------------------------------------------+
                                          |
                                          | HTTP (credentials: include)
                                          v
+-----------------------------------------------------------------------------------------+
|                                      SERVER LAYER                                       |
|                                                                                         |
|  [Helmet & CORS Middleware]                                                             |
|      |                                                                                  |
|      +--> Exact origin enforcement: CLIENT_URL (credentials: true)                      |
|      +--> Rejects wildcard '*' CORS on HTTP and WebSocket namespaces                   |
|                                                                                         |
|  [AuthController: POST /auth/refresh]                                                   |
|      |                                                                                  |
|      +--> Throttling: Redis rate limiting per IP                                        |
|      +--> Reads httpOnly cookie: 'refreshToken'                                         |
|      +--> Extracts sessionId from token (format: s_${sessionId}_${tokenSecret})         |
|      |                                                                                  |
|      v                                                                                  |
|  [RedisSessionsService: rotateRefreshToken]                                             |
|      |                                                                                  |
|      +--> Validates session status ('active') and max lifetime (now <= expiresAt)       |
|      +--> Checks token hash against currentRefreshTokenHash                             |
|      +--> CONCURRENT REFRESH GRACE POLICY:                                              |
|      |      - If previous token presented within GRACE_WINDOW (10s):                    |
|      |        Returns cached rotation result (grace recovery)                           |
|      +--> REUSE DETECTION:                                                              |
|      |      - If token presented was used > 10s ago:                                    |
|      |        REVOKES session family immediately                                        |
|      |        Emits security audit event & queues alert email                           |
|      +--> ATOMIC ROTATION:                                                              |
|      |      - Stores previous token hash with rotated timestamp                         |
|      |      - Issues new s_${sessionId}_${newSecret} token                              |
|      |      - Updates lastActiveAt and touches inactivity TTL (7 days)                  |
|      |      - Signs new short-lived JWT access token (15m expiry)                       |
|      |                                                                                  |
|      v                                                                                  |
|  [Response: HTTP 200]                                                                   |
|      +--> Body: { accessToken, user: { id, role, institutionId } }                      |
|      +--> Header: Set-Cookie: refreshToken=...; Path=/auth; HttpOnly; SameSite=Lax...   |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Cookie Attributes & CORS Audit

| Property | Current Value | Required Target | Safety Status & Assessment |
| :--- | :--- | :--- | :--- |
| **Cookie Name** | `refreshToken` | `refreshToken` | Safe. |
| **HttpOnly** | `true` | `true` | Safe. Cookie is inaccessible to JavaScript `document.cookie`. |
| **Secure** | `process.env.NODE_ENV === 'production'` | `process.env.NODE_ENV === 'production'` | Safe. Prevents plaintext transmission over HTTP in production while enabling local development. |
| **SameSite** | `lax` | `lax` | Safe. Balances CSRF protection with top-level OAuth redirects. |
| **Path** | `/` | `/auth` | **UNSAFE (FLAGGED)**: Path `/` sends the refresh cookie to every endpoint (`/blueprint`, `/library`, etc.), increasing exposure. Path should be restricted to `/auth` where `refresh` and `logout` live. |
| **Max-Age** | `7 * 24 * 3600 * 1000` (7 days) | `7 * 24 * 3600 * 1000` | Safe. Matches server inactivity TTL (7 days). |
| **Domain** | Omitted | Omitted | Safe. Host-only cookie prevents subdomain leaks. |
| **HTTP CORS Origin** | `config.get('CLIENT_URL', 'http://localhost:3000')` | Exact origin | Safe. Strict origin with `credentials: true`. |
| **WebSocket CORS** | `origin: '*'` | Exact `CLIENT_URL` origin | **UNSAFE (FLAGGED)**: `blueprint.gateway.ts` and `builds.gateway.ts` configure `origin: '*'` with `credentials: true`, which is insecure and invalid per CORS standards. |

---

## 3. Discovered Vulnerabilities & Implementation Gaps

### S1: Refresh Token Format Mismatch Between Controller and Service
- **Location:** `server/src/modules/auth/auth.controller.ts:162-170` vs `sessions.service.ts:155, 279`
- **Issue:** `auth.controller.ts` expects tokens in format `s_${sessionId}_${random}`, but `sessions.service.ts` generated `rt_${random}`. Any incoming `POST /auth/refresh` throws `401 INVALID_REFRESH_TOKEN_FORMAT`.
- **Severity:** **S1** (Feature failure / crash on refresh).

### S1: Race Condition on Concurrent Multi-Tab Refreshes (False Reuse Trigger)
- **Location:** `server/src/modules/auth/services/sessions.service.ts:256-266`
- **Issue:** When multiple requests hit `/auth/refresh` simultaneously with the same valid cookie, the first request rotates the token and adds the hash to `usedTokenHashes`. The second request immediately triggers `REFRESH_TOKEN_REUSE_DETECTED`, killing the user's entire session and locking them out.
- **Severity:** **S1** (Unintended session destruction).
- **Resolution:** Implement a 10-second grace window (`graceTokenHash`, `graceRotatedAt`, `graceAccessToken`, `graceRefreshToken`). If a token matching `graceTokenHash` is presented within 10 seconds of rotation, return the grace tokens. If presented after 10 seconds, trigger reuse revocation.

### S2: WebSocket CORS Wildcard with Credentials
- **Location:** `server/src/modules/blueprint/gateways/blueprint.gateway.ts:71` and `builds.gateway.ts:23`
- **Issue:** `origin: '*'` with `credentials: true`.
- **Severity:** **S2** (CORS misconfiguration).
- **Resolution:** Inject `ConfigService` and bind `cors.origin` to `CLIENT_URL`.

### S2: apiClient 401 Loop on Registration / Missing Replay Error Check
- **Location:** `client/src/lib/api-client.ts:55, 70-71, 88-89`
- **Issue:** 
  1. `apiClient` only excludes `/auth/login` and `/auth/refresh` from triggering refresh on 401; `/auth/register` is not excluded.
  2. When replaying a request after refresh, `apiClient` does not check `if (!retryRes.ok)` or parse JSON errors, returning error objects as success.
  3. Network failures (5xx/offline) during refresh reject without distinguishing transient network errors from definitive 401/403 session expiration.
- **Severity:** **S2** (Client loop and silent error consumption).

### S3: Missing Throttling on `POST /auth/refresh`
- **Location:** `server/src/modules/auth/auth.controller.ts:141`
- **Issue:** No rate limiting applied to the refresh endpoint, allowing potential brute force attacks.
- **Severity:** **S3** (Rate limiting).
- **Resolution:** Apply `ThrottlerService` to rate limit refresh requests per IP (e.g., 30 per minute).

---

## 4. Verification Test Plan (15 Scenarios)

### Server Integration Tests (`refresh-flow.spec.ts`)
1. **Refresh success**: Valid refresh token returns a new access token, sets rotated cookie, and updates session version.
2. **Concurrent refresh within grace window (10 parallel requests)**: 10 parallel requests with the same cookie all succeed and return consistent tokens without triggering reuse detection.
3. **Reuse after grace window**: Presentation of an old token after 10s revokes the session family and rejects subsequent refreshes.
4. **Invalid tokens & error stability**: Expired token, tampered token, malformed format, missing cookie, revoked session, and suspended user each return 401/403 with stable error codes.
5. **Session revocation on password change**: Changing password revokes other sessions and their refresh fails immediately.
6. **Inactivity timeout & maximum lifetime**: Refresh fails if inactive beyond 7 days or beyond 30 days max lifetime.
7. **MFA-pending restriction**: MFA challenge state cannot be refreshed or upgraded into a full session.
8. **Logout & logout-all**: Logout revokes session and clears cookie; logout-all terminates all user sessions.
9. **Throttling**: Normal multi-tab refresh stays under threshold; excessive requests trigger rate limiting without locking out the account.
10. **Response headers & security**: Set-Cookie specifies `Path=/auth; HttpOnly; SameSite=Lax`, CORS specifies exact origin, and response body contains only the access token and user info.

### Client Unit Tests (`api-client.spec.ts`)
11. **Single-flight**: 5 concurrent 401 responses trigger exactly one `/auth/refresh` call and all 5 replay once.
12. **Loop prevention**: 401 from `/auth/refresh`, `/auth/login`, or `/auth/register` never triggers refresh. Replayed request that 401s again does not refresh again.
13. **Network error resilience**: 5xx or network drop during refresh does not log out the user and surfaces a retryable error.
14. **Step-up non-expiry**: 403 `STEP_UP_REQUIRED` is not treated as session expiry.
15. **Definitive failure handling**: 401 on refresh clears store, cancels queries, and triggers a single toast notification.
