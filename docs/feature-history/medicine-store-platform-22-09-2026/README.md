# Medicine Store Platform — Status Report — 2026-09-22

Branch: `feat/pharmacy-medicinestore`
Scope: MR/medicine-store storefront + patient medicine experience + prescription availability round-trip.

## Verification Level Legend

- **BUILD** — code written, typechecked/builds green, backend boots (models + app load).
- **RUNTIME** — end-to-end exercised against a live DB/API (NOT yet done this session — no running DB confirmed; final smoke test outstanding).

## 19-Item Status

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | MR frontend scaffold (`frontend-mr/`) | DONE — BUILD | Next 16 + MUI 9 + RHF + zod + react-query; `next build` green. |
| 2 | MR login + dashboard shell fix | DONE — BUILD | Prev session (`frontend-mr/docs/feature-history/medicine-login-dashboard-fix-22-09-2026/`). |
| 3 | MR design standardization (categories/medicines/orders/notifications) | DONE — BUILD | Prev session (`frontend-mr/docs/feature-history/mr-frontend-design-standardization-21-09-2026/`). |
| 4 | Category `slug` 422 fix | DONE | Prev session (`backend/docs/feature-history/medicine-category-422-fix-22-09-2026/`). |
| 5 | Prescription request schema fix | DONE | Prev session (`backend/docs/feature-history/prescription-request-schema-fix-22-09-2026/`). |
| 6 | **CategoryId type mismatch fix (new + edit medicine forms)** | DONE — BUILD | zod `z.union([number, literal("")])` on both pages; `""` sentinel → `undefined` on submit; edit reset `med.categoryId ?? ""`. |
| 7 | **Move patient medicine/orders/prescriptions to `/dashboard/*`** | DONE — BUILD | Pages were at `/medicines`, `/orders`, `/prescriptions` but `ROUTES.dashboard.*` pointed at `/dashboard/...`. Moved `(dashboard)/medicines|orders` → `(dashboard)/dashboard/...`, fixed nested `prescriptions/prescriptions` → `share/` + `requests/`. All routes link via `ROUTES.*`. |
| 8 | **Browse search by genericName/manufacturer/name** | DONE — BUILD | `medicineStore.service.js` uses `Op.or` + `Op.like` across all three; ordered `createdAt DESC`. |
| 9 | **Browse provider include + availability filter** | DONE — BUILD | Includes category + provider (User); `availability=in` → stock>0, `out` → stock≤0; validated in `medicineStore.validator.js`. |
| 10 | **Prescription availability backend** | DONE — BUILD | New `PrescriptionRequestItem` model, `prescription_request_items` table (migration 033), associations, idempotent `ensurePrescriptionAvailability`; provider answers replace prior set in a transaction; status → `processing`. |
| 11 | **Order-off-prescription backend** | DONE — BUILD | `placeOrderFromPrescription` — patient authorizes, only `available` items, one `MedicineOrder` per selection (with `prescriptionRequestId`), row-lock + server-side price/stock decrement, request → `completed`, notifications both sides. |
| 12 | **Authed prescription file streaming** | DONE — BUILD | `GET /api/medicine/prescriptions/:id/file` streams via `uploadService.readByUrl`, inline headers, `no-store`, participant-only; frontends fetch as blob → `URL.createObjectURL`. No public URL exposed to patients/providers. |
| 13 | **Notifications for the round-trip** | DONE — BUILD | `prescription_shared` (provider), `prescription_*` status (patient), `prescription_availability_submitted` (patient), `order_placed` (provider + patient). |
| 14 | **MR availability editor page** | DONE — BUILD | `frontend-mr/src/app/(dashboard)/prescriptions/[id]/page.tsx` — blob file viewer, patient card, tick-own-inventory with qty, dynamic "not available" rows, reject, read-only when closed. |
| 15 | **MR list links to detail** | DONE — BUILD | "View & Check Availability" → `PRESCRIPTION_DETAIL(id)` (no more public `fileUrl` button). |
| 16 | **Patient request detail + order form** | DONE — BUILD | `/dashboard/prescriptions/requests/[id]` — blob file viewer, status, provider name, per-item qty pickers, delivery address/notes, total, place order → My Orders. |
| 17 | **Patient requests list → authed detail** | DONE — BUILD | "View status" link to detail (public `fileUrl` link removed). |
| 18 | **Patient medicines: in-stock filter + provider info** | DONE — BUILD | Checkbox → `availability:"in"`; provider name on cards + detail page. |
| 19 | **"Find Medicine" home entry** | DONE — BUILD | `discovery.ts` pharmacy `live: true` → `ROUTES.dashboard.medicines`; `ExploreCategories` renders the Explore card/link for it. |

## Verification Commands Run

- `backend`: `node --check` on all touched files → OK; `require ./src/models` → 60 exports, associations reflect (`PrescriptionRequestItem.[request, medicine]`, `PrescriptionRequest.[patient, provider, items, orders]`, `MedicineOrder.[medicine, patient, prescriptionRequest]`); `require ./src/app` → loads.
- `frontend-mr`: `npm run build` → green (fixed MUI v9 `slotProps.htmlInput` on the qty field).
- `frontend-patient`: `npm run build` → green; new routes present (`/dashboard/medicines`, `/dashboard/medicines/[id]`, `/dashboard/orders/*`, `/dashboard/prescriptions/{requests, requests/[id], share}`).
- Lint: repo-wide pre-existing errors (`no-explicit-any`, React-Compiler `set-state-in-effect`) are the established style on every page; builds/typecheck are the gate and are green. Removed the one unused import my edit created (MR `Link`).

## Key Design Decisions

- **Category fix (item 6):** DB/Joi/TS are number-based. `<MenuItem value={c.id}>` yields a number; `""` is a sentinel for "none" → `undefined` before submit, so `undefined` skips Joi keys and RHF `value ?? ""` keeps the select controlled. Never `String(categoryId)`.
- **No OCR/AI:** availability is a human stock check; available items snapshot name/qty/price from the provider's own active inventory, order re-validates live stock under row lock and uses DB price.
- **Sequelize mapping:** `underscored: true` in `backend/src/config/database.js` maps `prescriptionRequestId` → `prescription_request_id` (migration 033 ALTER) — verified.
- **Feature 10 (no public file URL):** patients/providers never get the storage URL for prescriptions; only the authed stream endpoint.

## Outstanding (required before claiming RUNTIME-complete)

1. Boot backend + run migration 033 (or boot `npm run dev` which runs `ensurePrescriptionAvailability` idempotently).
2. Smoke test: register MR → add medicine → patient upload+share → MR view/check availability → patient place order → verify `medicine_orders.prescription_request_id`, stock decrement, notifications, file stream.
3. Then flip the above items to RUNTIME and close the report.