# Testing Guide

## Current state

| Kind | Status |
|---|---|
| Unit tests | None (no test files under `frontend-mr/`) |
| Component tests | None; no Jest/Vitest/Testing Library dependency in `package.json` |
| E2E (Playwright/Cypress) | None in this folder |
| `npm test` | Does not exist (scripts: `dev`, `build`, `start`, `lint`) |
| Static checks | `npm run lint` (ESLint 9 flat config) and `next build` (type check) |
| Backend tests | Live in `backend/test/` (pharmacy, diagnostic, ...) and are described by the backend docs; the old pharmacy report records `backend/test/pharmacy/pharmacy.test.js` (21 scenarios) run against a local API |

Prior verification recorded in older docs (not re-run for this document): headless Puppeteer smoke test of 18 portal screens at desktop 1440 and mobile 390 widths (`frontend-mr/docs/feature-history/pharmacy-management-09-10-2026`), `tsc` clean and `next build` green with 23 routes at that time, lint 12 pre-existing problems (down from 18). Treat those as historical.

## Commands

```bash
npm run lint
npx tsc --noEmit      # not a package script; type check only
npm run build         # type check + production build
```

Known lint noise reported in older docs: `no-explicit-any` and React Compiler `set-state-in-effect` findings in older fetch-in-effect pages (several pages still use `any`, e.g. error handlers in the prescription detail page).

## Manual test checklist (derived from implemented behaviour)

Auth
1. Register each provider type; verify redirect to `/dashboard`, role label in the app bar, and role-specific sidebar.
2. Login with wrong password: error toast and no page reload.
3. Delete the `access_token` cookie: next navigation should refresh via `refresh_token` or return to `/login`.
4. Lab user visiting `/medicines`, pharmacy user visiting `/diagnostics`: redirected to `/dashboard`.

Pharmacy
5. Add medicine from catalogue and as new; with expiry but no batch number the form must block.
6. Edit: receive stock as batch; edit batch; check the ledger row and type filter.
7. Bulk import: template download, preview with both strategies, import, report.
8. Purchase: create (supplier invoice no. and date required), view, print, cancel; stock and dashboard update.
9. Stock and expiry tabs; write off expired.
10. Order: walk allowed transitions; reject returns stock; UPI-QR order shows Mark payment received; Record a return and open the credit note; print invoice.
11. Prescription request: file loads, tick items with qty, add unavailable row, submit (needs >= 1 item), reject.
12. Billing tabs and filters; Reports tabs with period change; Settings (GSTIN format, expiry days) and QR upload/remove.
13. Notifications: read one, read all, pagination.

Lab
14. Open a pending request: becomes "Viewed"; answer tests; confirm booking; mark completed; upload report per test; open report; reject with reason.
15. Tests catalogue: create, toggle available, delete.

Responsive and print
16. Check 390 px and 1440 px for every list page (cards vs tables) and no horizontal page scroll.
17. Print preview for invoice, credit note and purchase detail.

## Suggested additions (not implemented)

Vitest + Testing Library for `getApiErrorMessage`, `canAccessRoute`, `ORDER_NEXT_STATUS`, zod schemas; Playwright smoke tests for login, add medicine and order transitions against a seeded test API.
