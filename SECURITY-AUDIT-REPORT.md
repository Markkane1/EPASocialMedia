# Security Audit Report
**Application:** EPA Punjab Social Media Executive Operations Dashboard  
**Date:** September 2026  
**Auditor:** Senior Application Security & Architecture Agent (Antigravity)  
**Scope:** Phase 0 Comprehensive Security Audit (Codebase, Authentication, Authorization, APIs, Sessions, Secrets, Browser Security)  
**Status:** Read-Only Audit Complete — Zero Code Modifications Applied

---

## 1. Executive Summary

A comprehensive architectural and security audit was conducted on the **EPA Punjab Social Media Executive Operations Dashboard** repository. The system is an internal, single-organization executive intelligence dashboard built with an Express/TypeScript backend, PostgreSQL persistence via Prisma ORM, and a vanilla JavaScript single-page application frontend styled with Sneat/Bootstrap 5.

The audit revealed multiple **Critical** and **High** severity vulnerabilities stemming from initial "vibe coding" implementation patterns:
1. **Unprotected Core Business Endpoints:** `GET /api/metrics` (executive intelligence data) and `POST /api/sync` (triggers scraping and live social API calls via child process execution) are completely public and require zero authentication.
2. **Untracked, Stateless Sessions with No Invalidation:** Authentication utilizes a custom HMAC-SHA256 token stored in client `localStorage`. The server maintains no session state, logout does not invalidate tokens on the server, and tokens have no idle timeout (only a static 24-hour absolute expiration).
3. **Missing Route Guards:** Frontend client-side routing has no authentication checks; direct URL navigation allows unauthorized viewing of operational dashboards.
4. **Committed Secrets & Missing `.gitignore`:** Live Meta Graph API tokens are committed in `.env` and `backend/.env` files tracked by Git. No `.gitignore` file exists in the repository.
5. **Permissive CORS & Missing Security Headers:** CORS is configured with a wildcard `*`, allowing arbitrary external origins to query the API. HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) are entirely absent.
6. **Sub-standard Password Hashing:** Passwords use PBKDF2-SHA512 with only 10,000 iterations (OWASP recommends 600,000 iterations or Argon2id/bcrypt). Default plaintext passwords are documented in source code comments.
7. **Lack of Rate Limiting & Audit Logging:** Login endpoints and expensive synchronization triggers lack rate limiting or brute-force protections, and no security event audit trail exists.

---

## 2. Architecture Discovered

| Layer | Technology / Implementation | File Location |
|---|---|---|
| **Frontend Framework** | Vanilla JavaScript (ES6 Modules) + Bootstrap 5 + Sneat Admin Template | [`frontend/src/js/main.js`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/frontend/src/js/main.js) |
| **Backend Framework** | Express 4.21.2 on Node.js with TypeScript 5.7.2 | [`backend/src/app.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/app.ts) |
| **API Architecture** | RESTful JSON API mounted under `/api` | [`backend/src/interfaces/http/routes/apiRouter.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/interfaces/http/routes/apiRouter.ts) |
| **Database & ORM** | PostgreSQL with Prisma ORM 5.22.0 (with in-memory fallbacks) | [`backend/prisma/schema.prisma`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/prisma/schema.prisma) |
| **Auth Mechanism** | Custom HMAC-SHA256 signed base64url tokens via `Authorization: Bearer` | [`backend/src/infrastructure/auth/AuthService.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/infrastructure/auth/AuthService.ts) |
| **RBAC Mechanism** | Middleware `requireRole('ADMIN')`, roles: `ADMIN`, `EXECUTIVE` | [`backend/src/interfaces/http/middlewares/authGuard.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/interfaces/http/middlewares/authGuard.ts) |
| **Session Storage** | Client-side `localStorage` (`epa_auth_token`) | [`frontend/src/js/api/apiClient.js`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/frontend/src/js/api/apiClient.js) |
| **Password Hashing** | PBKDF2-SHA512 (10,000 iterations) with hex salt | [`backend/src/infrastructure/auth/AuthService.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/infrastructure/auth/AuthService.ts) |
| **Logging & Auditing** | Basic HTTP access logging; `SyncAuditLog` for data sync only | [`backend/src/interfaces/http/middlewares/requestLogger.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/interfaces/http/middlewares/requestLogger.ts) |
| **Test Framework** | Jest 29.7.0, Supertest 7.0.0, ts-jest | [`backend/package.json`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/package.json) |

---

## 3. Authentication Findings

1. **Unprotected Core Operational APIs:**
   * In [`apiRouter.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/interfaces/http/routes/apiRouter.ts#L58-L63), `GET /metrics` and `POST /sync` are categorized under `// 4. Public Routes`.
   * Any anonymous caller can query sensitive executive analytics or trigger server-side social sync processes.
2. **Custom Hand-Rolled Token Implementation:**
   * [`AuthService.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/infrastructure/auth/AuthService.ts#L29-L68) rolls a custom two-part token (`${payloadB64}.${signature}`) using Node `crypto.createHmac`. While timing-safe comparison is properly utilized, the implementation lacks standard claims (`iat`, `jti`, `iss`, `aud`), refresh tokens, and revocation identifiers.
3. **Hardcoded Fallback Secret:**
   * [`AuthService.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/infrastructure/auth/AuthService.ts#L13) defines:
     `private static readonly SECRET = process.env.JWT_SECRET || 'EPA_PUNJAB_SECURE_AUTH_SECRET_2026_KEY_#$';`
   * If `JWT_SECRET` is omitted from the environment, any attacker knowing the repository source can forge administrative tokens.
4. **No Server-Side Session Tracking:**
   * Tokens are completely stateless. Once issued, the server cannot invalidate, revoke, or blacklist a compromised token before its 24-hour expiration.

---

## 4. Session Findings

1. **No Session Invalidation on Logout:**
   * In [`AdminSettingsView.js`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/frontend/src/js/components/AdminSettingsView.js#L326-L330), logging out merely calls `ApiClient.clearToken()` which removes the key from browser `localStorage`.
   * No request is sent to the server. The discarded token remains 100% valid for API calls until its 24-hour lifetime elapses.
2. **Missing Idle Timeout:**
   * Tokens are issued with a static expiration: `exp: Date.now() + 24 * 3600 * 1000`.
   * There is no sliding window or inactivity detection. A session abandoned on an unattended workstation remains valid for an entire day.
3. **Storage Vulnerability (`localStorage`):**
   * Storing auth tokens in `localStorage` ([`apiClient.js`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/frontend/src/js/api/apiClient.js#L8-L18)) makes them directly accessible to any script execution (XSS).
4. **No Session Invalidation on Account Changes:**
   * The database model has no token versioning, password versioning, or revocation table. Password or role changes do not terminate existing sessions.

---

## 5. RBAC Findings

1. **Two Coarse Roles:**
   * Roles defined in Prisma schema and entity: `ADMIN` and `EXECUTIVE`.
   * No granular permissions exist.
2. **Role Enforcement Scope:**
   * Only `/api/config` and `/api/test-connection` enforce `requireRole('ADMIN')`.
   * All other routes either require basic authentication (`/api/auth/me`) or are completely public (`/api/metrics`, `/api/sync`).
3. **Client-Side Gate Bypass:**
   * In [`AdminSettingsView.js`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/frontend/src/js/components/AdminSettingsView.js#L26), the view toggles between login form and settings panel using `state.isAdmin()`.
   * A user can open browser DevTools and execute `state.setCurrentUser({ role: 'ADMIN' })` to render the settings UI. (While backend API calls reject unauthorized requests, the UI exposes internal form structures).

---

## 6. Route Findings

1. **Frontend Route Protection is Non-Existent:**
   * [`viewRouter.js`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/frontend/src/js/router/viewRouter.js#L12-L23) listens for `hashchange` and transitions views (`#dashboard`, `#platform/*`, `#settings`) without verifying whether an active authenticated session exists.
2. **Exposed Frontend Source Directory:**
   * In [`app.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/app.ts#L30):
     `app.use('/src', express.static(frontendSrcDir));`
   * The entire unbundled frontend JavaScript source tree is directly browsable and downloadable by anyone over HTTP.

---

## 7. API Findings

| Method | Path | Current Auth | Intended Auth | Enforced Server-Side | Risk Level |
|---|---|---|---|---|---|
| `GET` | `/api/status` | None | Public | Yes | Low (Info) |
| `GET` | `/api/health` | None | Public | Yes | Low (Info) |
| `GET` | `/api/metrics` | None | Authenticated (`EXECUTIVE` / `ADMIN`) | ❌ **No** | **CRITICAL** |
| `POST` | `/api/sync` | None | Authenticated (`ADMIN`) | ❌ **No** | **CRITICAL** |
| `POST` | `/api/auth/login` | None | Public | Yes | **HIGH** (No rate limiting) |
| `GET` | `/api/auth/me` | `authenticateToken` | Authenticated | Yes | Low |
| `GET` | `/api/config` | `authenticateToken` + `requireRole('ADMIN')` | `ADMIN` | Yes | Low |
| `POST` | `/api/config` | `authenticateToken` + `requireRole('ADMIN')` | `ADMIN` | Yes | **HIGH** (Mass assignment) |
| `POST` | `/api/test-connection` | `authenticateToken` + `requireRole('ADMIN')` | `ADMIN` | Yes | Low |

*Note:* There is no `POST /api/auth/logout` endpoint in the application.

---

## 8. Database & Data Access Findings

1. **Mass Assignment in System Configuration:**
   * [`ConfigController.updateConfig`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/interfaces/http/controllers/ConfigController.ts#L20-L28) accepts arbitrary keys from `req.body` and passes them directly to `ConfigService.saveConfig()`, which writes them to `.env` and `system_settings` table.
   * An administrative request could overwrite critical environment variables such as `DATABASE_URL`, `PORT`, or `NODE_ENV`.
2. **Resilient In-Memory Fallbacks Contain Hardcoded Credentials:**
   * In [`PrismaUserRepository.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/infrastructure/database/PrismaUserRepository.ts#L10-L33), if PostgreSQL is unreachable, the system falls back to an in-memory repository seeded with hardcoded admin and executive user records.
3. **No SQL Injection Identified:**
   * Database access through Prisma ORM uses parameterized queries. No raw string interpolation into SQL queries was found.

---

## 9. Password and Account Security Findings

1. **Weak PBKDF2 Iteration Count:**
   * [`AuthService.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/infrastructure/auth/AuthService.ts#L17) uses `10,000` iterations of PBKDF2 with SHA-512.
   * OWASP Password Storage Cheat Sheet recommends a minimum of **600,000 iterations** for PBKDF2-HMAC-SHA512, or modern memory-hard functions like Argon2id or bcrypt.
2. **Plaintext Passwords Documented in Source Code:**
   * [`PrismaUserRepository.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/infrastructure/database/PrismaUserRepository.ts#L14) lines 14 and 24 contain comments stating the exact default plaintext passwords:
     `// Admin@EPAPunjab2026!` and `// Executive@EPAPunjab2026!`
3. **Missing Account Lifecycle Controls:**
   * No account disablement field (`isActive` / `isDisabled`) exists in `schema.prisma`.
   * No password change endpoint or password reset workflow exists.
   * No failed login tracking or account lockout mechanism exists.

---

## 10. Browser & Web Security Findings

1. **Wildcard Permissive CORS:**
   * [`app.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/app.ts#L12-L16) configures CORS with `origin: '*'`. Any external website executing in a browser can initiate cross-origin requests to this backend.
2. **Missing HTTP Security Headers:**
   * No `helmet` or custom headers are configured. Missing:
     * `Content-Security-Policy` (CSP)
     * `X-Content-Type-Options: nosniff`
     * `X-Frame-Options: DENY`
     * `Strict-Transport-Security` (HSTS)
     * `Referrer-Policy: strict-origin-when-cross-origin`
3. **Absence of HttpOnly Cookies:**
   * Tokens are transferred in JSON response bodies and stored in `localStorage`, exposing authentication credentials to XSS.

---

## 11. Secrets and Configuration Findings

1. **Git Tracking of Active `.env` Files:**
   * Both `.env` (root) and `backend/.env` are tracked and committed into the Git repository.
2. **Missing `.gitignore`:**
   * There is no `.gitignore` file anywhere in the workspace.
3. **Exposed Live API Tokens:**
   * The committed `.env` file contains live Meta Graph API Access Tokens (`FB_ACCESS_TOKEN`, `IG_ACCESS_TOKEN`) with page and user IDs.
4. **Hardcoded JWT Secret Fallback:**
   * Default secret string present in `AuthService.ts`.

---

## 12. Development Bypass Findings

1. **Unchecked Shell Execution in Sync Flow:**
   * [`LiveWebScraperService.ts`](file:///d:/web%20temps/EPA%20Systems/Social%20Media%20Dashboard/backend/src/infrastructure/fetchers/LiveWebScraperService.ts#L49) invokes `exec('python "${scriptPath}"')`. Because `POST /api/sync` is public, any anonymous client can trigger child process executions repeatedly, causing resource starvation or DoS.
2. **In-Memory User Fallback with Static Salts:**
   * When database connectivity is lost, the application seamlessly logs in using static in-memory user objects, which could mask database outage in production.

---

## 13. Dependency Findings

* `npm audit` in `backend` reported **0 known vulnerabilities**.
* Missing standard security packages:
  * `helmet` (HTTP security headers)
  * `express-rate-limit` (endpoint throttling)
  * `cookie-parser` (HttpOnly cookie handling)
  * `argon2` or `bcrypt` (modern password hashing)

---

## 14. Existing Test Coverage

* Test Suites: 3 suites, 15 tests (all currently passing).
  * `tests/unit/auth.test.ts`: Password hashing, token signing, basic login success/failure.
  * `tests/unit/metrics.test.ts`: Metric calculations and masking rules.
  * `tests/integration/api.test.ts`: API endpoints integration test.
* **Security Test Deficiencies:**
  * Tests currently verify and expect `POST /api/sync` to succeed anonymously (`api.test.ts:79`).
  * No tests for token expiration, idle timeout, session revocation, rate limiting, or input validation.

---

## 15. Categorized Security Findings

### Critical
* **SEC-CRIT-01:** `GET /api/metrics` and `POST /api/sync` are completely public without authentication.
* **SEC-CRIT-02:** Live Meta Graph API secrets and `.env` files are tracked in Git; repository lacks `.gitignore`.
* **SEC-CRIT-03:** Hardcoded fallback token secret in `AuthService.ts`.
* **SEC-CRIT-04:** Tokens are completely stateless with no server-side invalidation or logout revocation.

### High
* **SEC-HIGH-01:** Weak PBKDF2 hashing (10,000 iterations) and plaintext passwords committed in source code comments.
* **SEC-HIGH-02:** Wildcard CORS (`*`) allows unauthorized cross-origin requests.
* **SEC-HIGH-03:** Frontend hash routes lack authentication guards; raw frontend source tree is statically served over `/src`.
* **SEC-HIGH-04:** Mass assignment vulnerability in `POST /api/config` allows overwriting server environment variables.
* **SEC-HIGH-05:** Denial of Service risk: unauthenticated `POST /api/sync` spawns synchronous Python scraping processes.

### Medium
* **SEC-MED-01:** Tokens stored in `localStorage` instead of `HttpOnly`, `SameSite` cookies.
* **SEC-MED-02:** Missing HTTP security headers (CSP, HSTS, X-Frame-Options, nosniff).
* **SEC-MED-03:** No rate limiting or brute-force protection on `POST /api/auth/login`.
* **SEC-MED-04:** No idle session timeout (only 24-hour absolute token expiration).

### Low & Informational
* **SEC-LOW-01:** Missing user lifecycle attributes (`isActive`, `failedLogins`, `lastLoginAt`).
* **SEC-INFO-01:** Security audit logging for auth events (login success/failure, logout) is missing.

---

## 16. Recommended Remediation Phases

1. **Phase 1 (Authentication Enforcement):** Protect `GET /api/metrics` and `POST /api/sync` with `authenticateToken`. Enforce frontend route guards.
2. **Phase 2 (Session Lifecycle):** Implement server-side session tracking / revocation, configurable idle timeout (30m) and absolute timeout (8h), and real `POST /api/auth/logout`.
3. **Phase 3 (RBAC):** Formalize User $\to$ Role $\to$ Permission mapping; enforce `requireRole('ADMIN')` on `POST /api/sync` and config routes.
4. **Phase 4 (API Security & Mass Assignment):** Apply strict Zod schema validation to `POST /api/config`, prohibiting modification of runtime variables (`DATABASE_URL`, `PORT`, `NODE_ENV`).
5. **Phase 5 (Password & Account Security):** Upgrade password hashing to Argon2id/bcrypt; remove plaintext passwords from comments; implement login rate limiting.
6. **Phase 6 (Browser & Web Security):** Transition authentication to `HttpOnly`, `SameSite=Strict`, `Secure` cookies; lock down CORS; add Helmet security headers.
7. **Phase 7 (Input Validation & Error Security):** Centralize Zod validation on all API inputs; sanitize error responses to prevent stack trace leaks.
8. **Phase 8 (Secrets & Environment):** Add `.gitignore`; remove `.env` from Git tracking; mandate environment-supplied `JWT_SECRET`; rotate exposed Meta tokens.
9. **Phase 9 (Rate Limiting):** Add IP and account-based rate limiting on `/api/auth/login` and sensitive endpoints.
10. **Phase 10 (Audit Logging):** Implement security event logging (login, logout, auth failures, config changes).
11. **Phases 11–16:** User management, dependency hardening, automated test suites, pen-testing, and final review.

---

## 17. Items Requiring Human / Business Decision

1. **Credential Rotation:** The Meta Graph API access tokens in `.env` were committed to Git. Should these tokens be revoked and regenerated immediately in the Meta Developer Portal?
2. **Session Delivery Mechanism:** Should authentication transition to **HttpOnly cookies** (recommended for web SPA) or remain **Bearer tokens** in headers with a server-side token blacklist/revocation table?
3. **Role Permission for Data Synchronization:** Should `POST /api/sync` be restricted strictly to `ADMIN` users, or should `EXECUTIVE` users also be permitted to trigger live platform syncs?
