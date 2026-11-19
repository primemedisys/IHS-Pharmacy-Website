# Diagnostic Lab Center — 2026-09-26

Branch: `feat/pharmacy-medicinestore`
Scope: a third provider type (Diagnostic Lab Center) added alongside the two pharmacy types, with the
patient → lab → availability/price → booking → completion → report workflow. **Extension only** —
the pharmacy (Medicine Store) flow is unchanged.

## Flow

```
PATIENT ── share prescription ──► choose destination
                                   ├── Medicine Store (unchanged)
                                   └── Diagnostic Lab ─► labs in the selected Google city/state
                                                           ─► send prescription
LAB: pending → viewed → available (tests + ₹ prices) ──► PATIENT picks tests + date
     booking_requested → confirmed → test_completed → upload report(s) → report_ready
     (rejected possible from pending / viewed / available / booking_requested)
PATIENT: notified at each step; report filed into Medical Records (source "diagnostic_lab")
ADMIN:   lab counts + workflow ledger (no files, no test names)
```

## Design decisions

| Decision | Why |
|---|---|
| New role `diagnostic_lab` (`ROLES.DIAGNOSTIC_LAB`), self-registerable through the existing `/auth/register` | Same account model as the pharmacies (a `users` row with its Google location). |
| Signs in through the existing provider portal (`/auth/medicine/login`) via a new `PROVIDER_PORTAL_ROLES` list | The lab is deliberately **not** in any `*_MEDICINE_PROVIDER_ROLES` list, so every medicine route (except notifications) still 403s for it, and no diagnostic route admits a pharmacy. |
| Own tables, not `prescription_requests` | That table's `provider_type` / `status` enums and item FK (medicine inventory) are pharmacy-specific; separate tables are what guarantee the two provider families never see each other's requests. |
| 3 new tables: `diagnostic_tests` (lab catalogue), `diagnostic_requests` (request + booking on the row), `diagnostic_request_tests` (per-test answer, `is_selected`, `report_record_id`) | Minimum clean model. No booking table (one request has one booking) and no report table (see next row). |
| Reports are `uploaded_records` rows (`source = 'diagnostic_lab'`, tag = test names, location = lab name) | They appear in the patient's EXISTING Medical Records next to doctor prescriptions, with the lab as their source. |
| Notifications reuse `medicine_notifications` with `reference_type = 'diagnostic_request'` | No second notification system; the lab role was added to the notification routes (every query is scoped to `req.user.id`). |
| Location = the existing Google **city/state** match (`medicineStore.userLocationWhere`) | The patient share flow only captures city/state; there is no radius search anywhere in the app today. |
| Files streamed through the API (`/file`, `/tests/:testId/report`), `fileUrl` excluded from responses | Same privacy rule as the pharmacy prescription files. |
| Labs are usable immediately (no verification queue) | Same as pharmacies. |

## Backend (`backend/src`)

- `config/constants.js` — `ROLES.DIAGNOSTIC_LAB`, `SELF_REGISTERABLE_ROLES` += lab, `RECORD_SOURCES.DIAGNOSTIC_LAB`,
  `PROVIDER_PORTAL_ROLES`, `DIAGNOSTIC_REQUEST_STATUS`, `DIAGNOSTIC_LAB_TRANSITIONS`, `DIAGNOSTIC_*` lists.
- `db/migrations/038_diagnostic_lab.sql` + `db/ensureDiagnosticLab.js` (runs last at boot) — additive, idempotent:
  widen `users.role` and `uploaded_records.source`, create the 3 tables.
- Models: `diagnosticTest`, `diagnosticRequest`, `diagnosticRequestTest` (+ associations in `models/index.js`);
  `uploadedRecord.source` enum += `diagnostic_lab`.
- `services/diagnostic.service.js`, `controllers/diagnostic.controller.js`, `routes/diagnostic.routes.js` (`/api/diagnostics`),
  `validators/diagnostic.validator.js`.
- `services/adminDiagnostic.service.js`, `controllers/adminDiagnostic.controller.js`, `routes/adminDiagnostic.routes.js` (`/api/admin/diagnostics`).
- Small shared-file changes: `auth.service.loginMedicineProvider` + `medicineAuth.controller` use `PROVIDER_PORTAL_ROLES`;
  `medicineNotification.routes` admits the lab role; `upload.service.contentTypeFor()` helper; `server.js` calls the ensure;
  `config/swagger.js` documents all 16 new endpoints + the register role enum.

## API

See `config/swagger.js` (tags "Diagnostic Lab", "Admin – Diagnostic Labs"), served at `/api/docs`.

| Who | Method + path |
|---|---|
| Patient | `GET /diagnostics/labs` · `POST /diagnostics/requests` (multipart) · `GET /diagnostics/requests/mine` · `POST /diagnostics/requests/:id/book` |
| Lab | `GET /diagnostics/summary` · `GET /diagnostics/requests/incoming` · `PUT /diagnostics/requests/:id/status` · `PUT /diagnostics/requests/:id/response` · `POST /diagnostics/requests/:id/reports` (multipart) · `GET/POST /diagnostics/tests` · `PUT/DELETE /diagnostics/tests/:id` |
| Patient or its lab | `GET /diagnostics/requests/:id` · `GET /diagnostics/requests/:id/file` · `GET /diagnostics/requests/:id/tests/:testId/report` |
| Admin | `GET /admin/diagnostics/overview` · `GET /admin/diagnostics/requests` |

## Authorization

- Role gate per route (patient / diagnostic_lab / admin) **and** ownership in the service (`patientId` / `labId` must equal the caller) for every read, write and file stream.
- Status changes only along `DIAGNOSTIC_LAB_TRANSITIONS`; responding only while pending/viewed/available; booking only while available; reports only after test_completed and only for booked tests.
- Booking date: today … +180 days (server-side).

## Frontends

- **frontend-mr** (provider portal): 3rd registration option "Diagnostic Lab Center"; role-aware nav + UX route guard
  (`features/dashboard/nav.ts` `isDiagnosticLab` / `canAccessRoute`); lab overview; `/diagnostics` (incoming requests),
  `/diagnostics/[id]` (file viewer, test answer editor, reject, confirm/reject booking, mark completed, report upload),
  `/diagnostics/tests` (catalogue). Pharmacy pages unchanged.
- **frontend-patient**: share page gains "Where do you want to send it? [Medicine Store] [Diagnostic Lab]" (Medicine Store path
  unchanged); `/dashboard/diagnostics` + `/dashboard/diagnostics/[id]` (tests + prices, select tests + date, booking status,
  view/download reports); nav item; notification deep-links; `diagnostic_lab` record source chip.
- **frontend-admin**: "Diagnostic Labs" row on the dashboard (Total diagnostic labs, …), nav item, `/dashboard/diagnostics`
  tracking page (Labs / Workflow ledger / Status).

## Verification level

| Check | Result |
|---|---|
| Backend `node --check` on all touched files, `require('./src/app')` + models load | ✅ |
| `npm run build` — frontend-mr, frontend-patient, frontend-admin | ✅ all green |
| eslint on created/changed frontend files | ✅ 0 errors (1 pre-existing unused-import warning in frontend-admin hooks.ts) |
| Backend tests | none exist (`npm test` is a placeholder) |
| **Runtime end-to-end (TEST 1–8)** | ❌ **NOT RUN** — the configured DB is the remote RDS instance with live data and S3 storage; migration 038 has not been applied anywhere yet. |

## Outstanding before claiming RUNTIME-complete

1. Apply migration 038 (`npm run migrate`, or boot the backend — `ensureDiagnosticLab` runs on every boot) on a dev/test DB.
2. Walk TEST 1–8 from the spec: register lab → login → patient shares to lab → lab answers (MRI ₹5000, CBC ₹500) →
   patient books a date → lab confirms → completes → uploads report → patient views/downloads it in the request and in Records →
   admin sees the lab count and the workflow row.
3. Regression: pharmacy registration/login, share-to-Medicine-Store, provider prescription requests, cart/checkout, notifications.
