# Legacy Documentation Map

> **Historical note (documentation restructuring).** The pre-existing centralized `docs/` tree this map describes has been dissolved: every application now owns its documentation in `<app>/docs/`, and system-wide material lives in `docs-shared/`. Where a row still names an old `docs/<folder>` path, that centralized location no longer exists; in the shared map the "Legacy file" column already shows each document's new location. The authoritative old-to-new file mapping is `docs-shared/DOCUMENTATION-MIGRATION-REPORT.md`.

Older documents live in the monorepo's `docs/` folder (outside this folder, referenced by plain name only). This table records which were reviewed for `frontend-mr`, what was kept, and where the information now lives. "Read" = read in full or substantially; "Searched" = searched for relevant passages.

| Legacy document | Review | Relevance to this app | Where it is reflected now |
|---|---|---|---|
| `frontend-mr/docs/feature-history/mr-frontend-design-standardization-21-09-2026/README.md` | Read | MUI migration, component list, responsive rules, historical test list | `COMPONENTS.md`, `TECH-STACK-AND-DEPENDENCIES.md`; colour/typography claims superseded (see discrepancies) |
| `frontend-mr/docs/feature-history/medicine-store-platform-22-09-2026/README.md` | Read | Prescription availability round-trip, MR detail page decisions, no public file URL | `APPLICATION-OVERVIEW.md`, `FEATURES-AND-MODULES.md` (prescriptions) |
| `frontend-mr/docs/feature-history/pharmacy-management-09-10-2026/README.md` | Read | Pharmacy module scope, price conventions (GST-inclusive price, private buying price), limits | `FEATURES-AND-MODULES.md`, `KNOWN-LIMITATIONS-AND-DISCREPANCIES.md` |
| `frontend-mr/docs/feature-history/medicine-login-dashboard-fix-22-09-2026/README.md` | Read | `/auth/me` shape bug and `authorize` spread bug (history) | `API-INTEGRATION.md`, `TROUBLESHOOTING.md` |
| `backend/docs/feature-history/medicine-category-422-fix-22-09-2026/README.md` | Read | Category slug 422 (backend fix) | `FEATURES-AND-MODULES.md` (categories), discrepancies |
| `backend/docs/feature-history/prescription-request-schema-fix-22-09-2026/README.md` | Read | Backend Sequelize index/underscored fix; only background | discrepancies table (provider_type enum) |
| `frontend-mr/docs/feature-history/diagnostic-lab-26-09-2026/README.md` | Read (frontend section) | Lab console scope in this app, status machine, authorization | `APPLICATION-OVERVIEW.md`, `FEATURES-AND-MODULES.md`, `AUTHENTICATION-AND-PERMISSIONS.md` |
| `docs-shared/feature-plans/medicine-management-31-10-2026/` (README, api.md, mobile-notifications.md) | Read (README) | Doctor/patient medicine reminders and `medicine_masters` reuse; not an MR feature | Only the shared-catalogue concept; otherwise out of scope |
| `backend/docs/feature-history/logger.md` | Searched | Change log entries for frontend-mr (env inlining, 401 handling, error envelope, masters, substitutes, provider types) | `API-INTEGRATION.md`, `ENVIRONMENT-CONFIGURATION.md` |
| `docs-shared/legacy/IMPLEMENTATION-STATUS.md` | Searched | One line: frontend-mr Settings store QR + "Mark payment received" | `FEATURES-AND-MODULES.md` (settings, orders) |
| `docs-shared/legacy/PRODUCTION-READINESS-AUDIT.md` | Searched | Tracked `.env` with Maps key; portals list | `KNOWN-LIMITATIONS-AND-DISCREPANCIES.md` |
| `docs-shared/ci/jenkins-setup.md` | Searched (and root `Jenkinsfile`, `ecosystem.config.js`) | No mention of frontend-mr deployment | `DEPLOYMENT-GUIDE.md` |
| `docs-shared/feature-plans/auth/README.md`, `backend-auth-plan.md`, `frontend-auth-plan.md` | Searched | Token design, refresh rotation, planned middleware route guards (not present in this app) | `AUTHENTICATION-AND-PERMISSIONS.md` |
| `docs/dbstruct.md`, `docs-shared/legacy/indiahealthsystem.md` | Not read in depth | Shared DB/system overview; this app has no direct DB access | Referenced as `docs-shared/` by name |
| `backend/docs/modules/blood-bank/*`, `frontend-ambulance/docs/modules/ambulance/*` | Matched by search only | Mention frontend-mr as a pattern reference for other portals | Not applicable |
| `mobile-medicine-store/docs/legacy-word/IHS-Medicine-Store-Mobile-App-Documentation.docx`, `docs-shared/legacy/MOBILE_APPS.md` | Not read | Mobile medicine-store app, a different client of the same backend | Out of scope |

Number of legacy documents reviewed (read or searched): 18 distinct files or folders.

## Guidance for the future repository

* Treat this `docs/` folder as the primary documentation for `ihs-frontend-mr`.
* Legacy dated folders are change-history records; where they disagree with the code, the code (as described here) wins.
* When copying to a new repository, replace references to `docs-shared/...` with links to wherever the shared system docs are published.
