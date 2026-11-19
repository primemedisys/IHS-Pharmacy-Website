# ihs-frontend-mr - IHS Medicine Portal (provider console)

Web console for **medicine stores, pharmacy hospitals and diagnostic lab centers** on the India One Health System (IHS) platform. In the monorepo it lives in `frontend-mr/`; the planned standalone repository name is `ihs-frontend-mr`.

> Documentation baseline: written from the source tree on 2026-11-16 (branch `feat/pharmacy-medicinestore`). Every statement is grounded in files read; items that could not be verified are marked.

## What "MR" means here (and how this was determined)

The folder name `mr` stands for **Medicine Representative**, the original provider type. It is now a **retired** type: `src/types/index.ts` documents `mr` as "RETIRED ... No new account can be registered as `mr`", and the register page only offers `medicine_store`, `pharmacy_hospital` and `diagnostic_lab`. Today the product is the **Medicine Portal** (`NEXT_PUBLIC_APP_NAME` default "Indian Health System - Medicine Portal", short name "IHS MedPortal", `src/config/site.ts`). Evidence used: `src/types/index.ts` (ProviderType comment), `src/features/dashboard/nav.ts` (`roleLabel`), `src/app/(auth)/register/page.tsx`, `.env.example` header ("Medicine portal (frontend-mr) - runs on 3004"), and the old docs `frontend-mr/docs/feature-history/mr-frontend-design-standardization-21-09-2026/`.

## What it does

| Signed-in role (`user.role`) | Experience |
|---|---|
| `medicine_store` ("Pharmacy Medicine Store / Clinic") and `pharmacy_hospital` | Full pharmacy-management console: medicine inventory, batches and expiry, suppliers and purchases, patient orders, prescription availability requests, GST invoices and credit notes, reports, dashboard analytics, settings and UPI QR. |
| `diagnostic_lab` ("Diagnostic Lab Center") | Lab console: incoming diagnostic requests, answering which tests the lab can do, confirming bookings, uploading reports, a test catalogue. |
| `mr` (legacy) | Treated like a pharmacy by the UI (only `diagnostic_lab` is special-cased). Cannot register any more. |

The navigation, dashboard and route guard are role-aware (see `ROUTING-AND-NAVIGATION.md`). The browser never talks to a database; everything goes to the IHS backend REST API.

## Tech stack (summary)

Next.js 16.2.9 (App Router, React Compiler on, `output: "standalone"`), React 19.2.4, TypeScript 5, MUI 9 with an MUI CSS-variable theme, TanStack Query 5, axios, React Hook Form + zod 4, sonner toasts, `@mui/x-charts`, `@vis.gl/react-google-maps`, `react-icons` (Feather), `js-cookie`. Details: `TECH-STACK-AND-DEPENDENCIES.md`.

## Main features

| Area | Status |
|---|---|
| Login / register (email + password; location via Google Places) | Implemented (verified) |
| Pharmacy dashboard with KPIs, charts, alert centre | Implemented (verified) |
| Medicines: list/filter/sort/export, add (catalogue search or new), edit, batches, stock ledger, images, substitutes | Implemented (verified) |
| Bulk Excel import (template, preview, import, report) | Implemented (verified) |
| Stock and expiry (batches, low/out of stock, write-off) | Implemented (verified) |
| Suppliers and purchases (record, view, cancel, print) | Implemented (verified) |
| Patient orders: status workflow, payment confirmation, returns | Implemented (verified) |
| Prescription requests: view file, availability check, reject | Implemented (verified) |
| Billing: invoices, payments, credit notes (print) | Implemented (verified) |
| Reports: sales, top medicines, purchases, GST, stock | Implemented (verified) |
| Settings: GSTIN, licence, expiry window, invoice note, UPI payment QR | Implemented (verified) |
| Notifications list (read / read all) | Implemented (verified) |
| Diagnostic lab console (overview, requests, tests, reports) | Implemented (verified) |
| Google sign-in | Partially implemented (service method exists, no UI) |
| Categories management pages | Partially implemented (pages exist, nav item commented out) |
| Dark mode toggle, real-time notifications, profile page | Not found (see `KNOWN-LIMITATIONS-AND-DISCREPANCIES.md`) |

"Implemented (verified)" means the page, service call and backend route were all found in source; runtime behaviour was not exercised for this documentation.

## How it talks to the backend

Single axios instance (`src/utils/apiClient.ts`) with `baseURL = NEXT_PUBLIC_API_URL` (for example `http://localhost:5000/api`). A request interceptor attaches `Authorization: Bearer <access_token>` read from a cookie; a response interceptor refreshes the token once on a 401 using the `refresh_token` cookie. Feature code calls typed service modules in `src/services/` (auth, medicine, pharmacy, order, prescription, notification, diagnostic). Endpoints used and their backend routes: `API-INTEGRATION.md`.

## Install and run

Commands are exactly the scripts in `package.json`:

```bash
cd frontend-mr
cp .env.example .env.local     # then edit values (see ENVIRONMENT-CONFIGURATION.md)
npm install
npm run dev                    # next dev -p 3004  (note: "predev" runs npm install first)
```

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev -p 3004` | dev server on http://localhost:3004 |
| `npm run build` | `next build` | production build (standalone output) |
| `npm start` | `next start -p 3004` | serve the build on 3004 |
| `npm run lint` | `eslint .` | lint (eslint-config-next core-web-vitals + typescript) |

There is no `test` script and no test files (see `TESTING-GUIDE.md`). The backend must be running and reachable at `NEXT_PUBLIC_API_URL`.

## Environment variables

All are `NEXT_PUBLIC_*` (build-time, inlined into the browser bundle): `NEXT_PUBLIC_API_URL` (required), `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_ENV`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_COOKIE_DOMAIN`, `NEXT_PUBLIC_PATIENT_URL`, `NEXT_PUBLIC_DOCTOR_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_CLINIC_URL`, `NEXT_PUBLIC_MR_URL`. Full table: `ENVIRONMENT-CONFIGURATION.md`.

## Build and deploy

`npm run build` then `npm start` (or run the standalone server). In the monorepo, this app is **not** present in the root `Jenkinsfile` app registry, `ecosystem.config.js` or `.github/workflows/deploy.yml` as read on 2026-11-16; production deployment for it is therefore not defined there. See `DEPLOYMENT-GUIDE.md`.

## Document index

| File | Contents |
|---|---|
| `APPLICATION-OVERVIEW.md` | Purpose, users, workflows, diagrams |
| `ARCHITECTURE.md` | Layers, providers, request flow |
| `FOLDER-STRUCTURE.md` | Real directory tree |
| `TECH-STACK-AND-DEPENDENCIES.md` | Dependencies and which are actually used |
| `FEATURES-AND-MODULES.md` | Per-module behaviour and status |
| `ROUTING-AND-NAVIGATION.md` | Routes, sidebar, guards |
| `API-INTEGRATION.md` | Endpoint tables, envelope, errors |
| `AUTHENTICATION-AND-PERMISSIONS.md` | Cookies, refresh, role gating |
| `STATE-AND-DATA-FETCHING.md` | React Query keys, invalidation, forms |
| `COMPONENTS.md` | Shared and feature components, theme |
| `ENVIRONMENT-CONFIGURATION.md` | Env vars |
| `DEVELOPMENT-SETUP.md` | Local setup |
| `DEPLOYMENT-GUIDE.md` | Build/deploy |
| `TESTING-GUIDE.md` | Test status and manual checklist |
| `TROUBLESHOOTING.md` | Common problems |
| `KNOWN-LIMITATIONS-AND-DISCREPANCIES.md` | Gaps and old-doc conflicts |
| `LEGACY-DOCUMENTATION-MAP.md` | Where older docs fit |

Shared system documentation (outside this folder, referenced by name only): `docs-shared/` (platform architecture, database structure, auth design, CI).
