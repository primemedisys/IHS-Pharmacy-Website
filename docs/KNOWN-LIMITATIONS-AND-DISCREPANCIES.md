# Known Limitations and Discrepancies

Snapshot: 2026-11-16, branch `feat/pharmacy-medicinestore`. "Verified" = observed in source or git state; nothing was run.

## Known limitations

| # | Limitation | Evidence |
|---|---|---|
| 1 | Two pages resolve to `/`: `src/app/page.tsx` (redirect to `/login`) and `src/app/(dashboard)/page.tsx` (old 4-tile stats page). Behaviour/buildability of `/` is Unclear. `/dashboard` is the supported dashboard route. | `.next/app-path-routes-manifest.json` lists both for `/`; both files exist |
| 2 | The legacy stats page counts "pending orders" from only the first row (`limit: 1`) of the old per-order API, and is shadowed by `/dashboard`. Dead or misleading code. | `(dashboard)/page.tsx` |
| 3 | Google sign-in is wired in the service only; no button, and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is unused. | `auth.service.ts`; grep |
| 4 | `NEXT_PUBLIC_COOKIE_DOMAIN` and the four other-portal URL variables are defined but not used; cookies are host-scoped, so there is no cross-portal single sign-on from this app. Same-host portals on other ports do share cookies, which can interfere. | `env.ts`, `AuthProvider.tsx`, `apiClient.ts` |
| 5 | Tokens live in JS-readable cookies; no CSP. | `AuthProvider.tsx` |
| 6 | No single-flight lock on token refresh in the axios interceptor. | `apiClient.ts` |
| 7 | `AuthProvider` calls `GET /auth/me` on every pathname change. | `AuthProvider.tsx` effect deps `[pathname, router]` |
| 8 | No dark-mode toggle (theme supports it; default light). `next-themes` installed, unused. | `layout.tsx`, grep |
| 9 | No real-time notifications (no socket/polling); notifications load on page open. The sidebar has no unread badge. | grep for socket/refetchInterval |
| 10 | No profile page though `ROUTES.PROFILE` exists. Account menu has only name, email and Sign out. | `routes.ts`, `DashboardShell.tsx` |
| 11 | Categories pages exist but are hidden from the sidebar; no category delete. | `nav.ts` (commented line) |
| 12 | Prescription detail loads at most 100 of the pharmacy's medicines when choosing available items. | `prescriptions/[id]/page.tsx` (`limit: 100`) |
| 13 | Prescription detail error handlers read `err.response.data.message` instead of the shared envelope helper, so backend messages are lost. Several handlers type errors as `any`. | same file |
| 14 | No automated tests; no `test` script. | `package.json` |
| 15 | No deployment definition (Jenkins, pm2, Docker) for this app; no `public/` folder although `ogImage` is `/og.png`. | root `Jenkinsfile`, `ecosystem.config.js`; tree |
| 16 | `npm run dev` runs `npm install` first (`predev`). | `package.json` |
| 17 | `@tanstack/react-query-devtools`, `@mui/x-data-grid`, `@mui/x-date-pickers`, `@mui/lab`, `@mui/icons-material`, `framer-motion`, `jwt-decode`, `dayjs`, `clsx`, `tailwind-merge`, `class-variance-authority`, `react-loading-skeleton`, `next-themes`, `@react-oauth/google` are unused dependencies (bundle/install weight). | grep over `src/` |
| 18 | `useOnlineStatus`, several `API_ENDPOINTS` entries and the old per-order service methods are unused. | grep |
| 19 | Online payment is simulated in the backend; refunds are recorded (credit note) rather than paid out; no walk-in/counter sales; CGST/SGST shown as a half/half split (no IGST). | `frontend-mr/docs/feature-history/pharmacy-management-09-10-2026` "Not done / known limits"; UI label "Online (simulated)" |
| 20 | Report pages have no export; invoices print via browser only (no PDF generation in the app). | source |
| 21 | Four files used by tracked code (`AccentTile.tsx`, `PaymentQrCard.tsx`, `PharmacyOverview.tsx`, `UpiQrPayment.tsx`) are untracked in git; many other files are modified but uncommitted. | `git status` |
| 22 | The tracked `.env` contains a real Maps browser key (per audit); it should be untracked and the key restricted. | `docs-shared/legacy/PRODUCTION-READINESS-AUDIT.md` item 6 (value not reproduced here) |
| 23 | Retired `mr` accounts still log in and get the pharmacy UI; no UI hint of retirement beyond the role label. | `nav.ts`, backend `PROVIDER_PORTAL_ROLES` |

## Discrepancies between older docs and the code

| Topic | Older doc says | Verified code says |
|---|---|---|
| Theme colours | `frontend-mr/docs/feature-history/mr-frontend-design-standardization-21-09-2026`: primary navy `#001A4A`, secondary blue `#1A4FFF`, navy sidebar, dark mode with CSS variables, Bricolage Grotesque headings | `palette.ts`: primary `#102B5C`, secondary neutral slate, white page/cards, **sidebar `#075B4C` (deep green)** with white active pill, single font Plus Jakarta Sans, base radius 8 (2026-11 redesign comments) |
| Auth pages | Register page "MR/Medicine Store toggle" | Register offers three provider types: `medicine_store`, `pharmacy_hospital`, `diagnostic_lab`; `mr` is retired |
| Nav and pages | 7 dashboard pages (dashboard stats, medicines, new/edit, orders, notifications) | ~25 routes including inventory, purchases, suppliers, billing, reports, settings, prescriptions, diagnostics |
| Dashboard | "Welcome + 4 StatisticCard tiles" | `/dashboard` renders `PharmacyOverview` (analytics, charts) or `LabOverview`; the 4-tile page remains only as the legacy `(dashboard)/page.tsx` |
| Route locations | `frontend-mr/docs/feature-history/medicine-store-platform-22-09-2026` item 7: pages moved under `/dashboard/*` (this refers to the patient app); MR pages sit at `/medicines`, `/orders`, `/prescriptions` | MR routes are top-level; only `/dashboard` is literal under `app/dashboard` |
| Order API | Earlier docs/services use per-order endpoints (`/medicine/orders/provider-orders`, `/:id/status`) | Pages use order **groups** (`/medicine/orders/groups/...`); per-order methods remain unused in the service |
| `getMe` | Old login fix: bug where `data.data.user` was read | Fixed: `getMe` returns `data.data` |
| Authorize bug | Old fix: `authorize([roles])` array bug in routes | Current routes use `authorize(...ROLES)` spread |
| Category creation | Old 422 doc: `slug` required by Joi, fixed backend-side | Frontend sends only `name`; consistent with backend generating slug |
| Medicine form | Old design doc: form with category select; CategoryId type-mismatch fix (22-09) | Current Add Medicine has no category step; search catalogue or add new |
| Sidebar sections | Design doc and 2026-09 docs predate Categories removal | `Categories` sidebar entry commented out |
| Provider types in prescription schema | `backend/docs/feature-history/prescription-request-schema-fix-22-09-2026` shows `provider_type enum('mr','medicine_store')` | Frontend type list has `medicine_store`, `pharmacy_hospital`, `mr`, `diagnostic_lab` (backend enum at that date not re-checked) |
| Build route count | Design doc build: 9 static pages; pharmacy doc: 23 routes | Current tree has 28 page files (see `ROUTING-AND-NAVIGATION.md`) |
| SSO via `NEXT_PUBLIC_COOKIE_DOMAIN` | `.env.example` comment: "single sign-on across the apps" | Not implemented in this app |
| Project note about design system | Internal notes describe a blue-primary, white-sidebar system | This app currently ships navy primary with a green sidebar (verified in `palette.ts`) |

## Unverified items

* Whether `npm run build` currently succeeds given the duplicate `/` pages (not run).
* Whether `/og.png` is served from somewhere else.
* Exact token lifetimes (taken from shared auth docs, not the code).
* Backend CORS origin settings for port 3004.
* Runtime behaviour of any feature (no servers started).
