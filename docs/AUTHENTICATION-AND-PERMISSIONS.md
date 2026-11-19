# Authentication and Permissions

## Summary

Token-based auth against the IHS backend. Tokens are kept in **browser cookies written by JavaScript** (`js-cookie`), not HttpOnly cookies. Authorisation is enforced by the backend; this app adds a UX-only role guard.

## Tokens and storage

| Item | Cookie name | Lifetime set by this app | Attributes |
|---|---|---|---|
| Access token (JWT) | `access_token` | `expires: 1` (1 day cookie lifetime) | `sameSite: "lax"`, `secure` only when the page is served over `https:`; no `domain`, no `path` override |
| Refresh token | `refresh_token` | `expires: 7` (7 days) | same |

The cookie lifetimes are client-side only; the real validity of each token is decided by the backend (the shared auth design doc `docs-shared/auth` describes about 15 minutes for access and about 30 days for a hashed, rotating refresh token; not re-verified here). Because cookies are set without a `domain`, they are host-scoped. `NEXT_PUBLIC_COOKIE_DOMAIN` ("shared parent domain ... single sign-on across the apps" in `.env.example`) is validated in `env.ts` but **no code reads it**, so cross-portal single sign-on via a shared cookie domain is not implemented here.

## Flows

```mermaid
sequenceDiagram
  participant U as User
  participant A as AuthProvider
  participant S as apiClient
  participant B as Backend
  U->>A: submit login form
  A->>B: POST /auth/medicine/login {email, password}
  B-->>A: { user, tokens }
  A->>A: set access_token, refresh_token cookies; setUser
  A->>U: router.push /dashboard
  Note over S,B: later requests carry Bearer access_token
  S->>B: request
  B-->>S: 401
  S->>B: POST /auth/refresh {refreshToken}
  B-->>S: new tokens
  S->>B: replay request
```

* **Login**: `AuthProvider.login` -> `authService.login` -> `POST /auth/medicine/login`. The dedicated medicine endpoint exists in `backend/src/routes/auth.routes.js` (`medicineAuth.login`).
* **Register**: `POST /auth/register` with `role` in `medicine_store`, `pharmacy_hospital`, `diagnostic_lab` plus structured location; tokens are stored and the user is sent to `/dashboard`.
* **Bootstrap**: on every `pathname` change `AuthProvider` reads `access_token`; with no token and not on `/login` or `/register` it redirects to `/login`; with a token it calls `GET /auth/me`, sets the user, and redirects away from `/login`, `/register` or `/` to `/dashboard`; on failure it deletes both cookies and redirects to login.
* **Refresh**: described in `API-INTEGRATION.md`; there is no single-flight lock in this app's interceptor (parallel 401s each attempt a refresh; the backend uses refresh rotation and a dedicated `refreshLimiter` for this reason, as noted in `auth.routes.js`).
* **Logout**: `POST /auth/logout` (failure ignored), delete cookies, `/login`.
* **Google sign-in**: `authService.googleLogin` posts `{ credential }` to `/auth/medicine/google`, but no UI calls it and `@react-oauth/google` has no importer: **Partially implemented**.
* **Password reset / OTP**: not found in this app.

## Roles and what the UI does with them

`UserRole` = `medicine_store | pharmacy_hospital | mr | diagnostic_lab | patient | doctor | admin | clinic` (`src/types/index.ts`).

| Capability | Pharmacy roles (`medicine_store`, `pharmacy_hospital`, legacy `mr`) | `diagnostic_lab` |
|---|---|---|
| Dashboard | pharmacy analytics | lab overview |
| Medicines, inventory, purchases, suppliers, orders, prescriptions, billing, reports, settings | yes | blocked (redirect to `/dashboard`) |
| Diagnostics (`/diagnostics*`) | blocked | yes |
| Notifications | yes | yes |

Implementation: `isDiagnosticLab`, `canAccessRoute`, `dashboardNavForRole` in `src/features/dashboard/nav.ts`; applied in `DashboardShell`. Roles that are not providers (patient, doctor, admin, clinic) cannot sign in through this portal: the backend `medicineAuth.controller` restricts login to `PROVIDER_PORTAL_ROLES` (every pharmacy role including legacy `mr`, plus `diagnostic_lab`). The frontend therefore has no extra handling for them.

## Backend authorisation reference (read-only cross-check)

| Router | Rule |
|---|---|
| `/medicine/*` provider routes, `/medicine/pharmacy/*` | `authenticate` + `authorize(...ALL_MEDICINE_PROVIDER_ROLES)` (active provider roles plus legacy `mr`); `diagnostic_lab` is explicitly not in these lists |
| `/medicine/notifications/*` | patients, providers and `diagnostic_lab` |
| `/diagnostics/*` lab routes | `authorize(ROLES.DIAGNOSTIC_LAB)`; shared file/report/detail reads allow patient or lab |
| image curation on `/medicine/masters/:id/...` | providers and admin; deletion limited to uploader/admin per route comment |

## Security observations

* Tokens in JS-readable cookies are exposed to any XSS; no CSP or sanitisation layer is defined in this app.
* `robots: { index: false, follow: false }` keeps the console out of search results.
* Prescription and report files are never exposed as public URLs; they are streamed through authenticated endpoints and shown from blob URLs.
* `.env` in this folder is tracked by git although `.gitignore` lists it (see `KNOWN-LIMITATIONS-AND-DISCREPANCIES.md`). Only `NEXT_PUBLIC_*` public values are expected there; the repo audit notes a browser Maps key was committed.
