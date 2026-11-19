# Pharmacy Management System — Status Report — 2026-10-09

Branch: `feat/pharmacy-medicinestore`
Scope: a full management system for Medicine Store / Pharmacy Hospital providers in `frontend-mr`, built on the EXISTING medicine architecture (global `medicine_masters` + provider `medicine_store_medicines`, existing cart / order groups / payments / prescription requests / upload storage). No second medicine, inventory, order, billing or image system.

## History note

Three earlier sessions (2026-10-08) attempted this and stopped on connection errors; their code was never committed, but their schema and test data were left in the local `ihssss` database (`_migrations` rows `042_pharmacy_management.sql` (draft) and `043_pharmacy_management.sql`). This branch re-creates that work — reviewed file by file — so the code matches the schema that already exists. Migration ids 041 / 042 are deliberately not reused (see the header of `043_pharmacy_management.sql`).

## Price conventions (config/pharmacy.js)

- `price` = selling price per unit, **GST-inclusive** (Indian retail convention). GST on a sale is a breakdown of the amount, never added on top — existing order totals are unchanged.
- `discount_percent` = the pharmacy's item discount; patient pays `price × (1 − d%)`. Default 0, so existing listings are unaffected until a pharmacy sets one.
- `buying_price` = purchase rate per unit, **excl. GST**. Private: excluded from every patient-facing read.
- `gst_rate` is whatever the pharmacy stores per item; no slab is assumed.
- Gross margin = sale taxable value − buying cost. It is **not** net profit (expenses are not tracked).

## What was built

| Area | Backend | Frontend (`frontend-mr`) |
|---|---|---|
| Medicines | inventory gains MRP, buying price, GST, discount, reorder level, SKU, HSN, pack size, supplier; server-side search / filter (stock, expiry, supplier, active) / sort / pagination | All Medicines (filters, export, activate/deactivate), Add Medicine (commercial fields + opening batch; image optional), Edit (pricing, batches, receive/correct stock, stock history, images) |
| Batches & expiry | `medicine_stock_batches`; sales FEFO, expired batches never sold; write-off | Stock & Expiry (expiring / expired / all batches / low / out) |
| Stock ledger | `medicine_stock_movements` — every change, with cause; restores go back to the exact batch | History table on Edit |
| Excel | template (from real columns, image NOT a column), preview (writes nothing), import (one transaction, bulk statements, idempotent: stock is SET), export | Bulk Import (template → upload → preview → import → report + CSV) |
| Suppliers | `pharmacy_suppliers` (per pharmacy) | Suppliers |
| Purchases | `pharmacy_purchases` / `_items`; server totals; stock IN; duplicate-invoice guard; cancel reverses (refused if sold) | Purchases, Record Purchase, Purchase detail |
| Orders | existing order groups; per-line snapshot of price / discount / GST / cost / batch at checkout; server filters | Patient Orders (status, payment, search, dates), Order detail |
| Billing | invoice derived from the order (no invoice table): store GSTIN / licence, HSN, batches, GST summary; returns → credit notes (`medicine_returns`) with exact refunds | Tax invoice (print / save PDF), Invoices & Payments, Credit note |
| Reports | sales (day/week/month), top medicines, purchases, GST (output / credit notes / input), stock valuation — SQL aggregates, 366-day cap | Reports |
| Settings | `pharmacy_profiles` (GSTIN, drug licence, expiry window, invoice note) | Settings |
| Dashboard | `/medicine/pharmacy/dashboard` | Dashboard (12 live figures + 4 lists) |

Patient app: cards / detail / cart show the discounted price when a pharmacy sets an item discount (previously would have shown the pre-discount price while checkout charged the discounted one).

## Verification

- `backend/test/pharmacy/pharmacy.test.js` — 21 scenarios, real HTTP, **21/21 pass** against the local dev DB (`PHARMACY_E2E_BASE_URL=http://localhost:5055`). The project-standard isolated run (`npm run test:db && npm test`) needs a `backend/.env.test` with a local `*_test` DB the MySQL user can create — not set up here.
- Headless browser smoke test (Puppeteer): 18 portal screens × desktop 1440 / mobile 390 — no runtime errors, no error UI, no horizontal page overflow.
- `frontend-mr`: `tsc` clean, `next build` green (23 routes); lint 12 problems, all pre-existing in untouched files (was 18).
- `frontend-patient`: `next build` green.

## Not done / known limits

- No counter (walk-in) sales: order groups require a patient account; adding them would change the order model.
- Refunds are recorded (credit note + `refunded` status), not paid out — payments are simulated / COD.
- Online payment remains simulated (no gateway).
- CGST/SGST split on the bill is shown as half/half of the total GST (intra-state); inter-state (IGST) is not modelled.
