# Features and Modules

Status legend: **Implemented (verified)** = page + service + backend route all found; **Partially implemented**; **Documented-but-not-found**; **Planned**; **Unclear**. Runtime behaviour was not exercised for this documentation (no servers were started).

## Module map

| # | Module | Pages | Primary service | Roles | Status |
|---|---|---|---|---|---|
| 1 | Authentication | `/login`, `/register` | `auth.service.ts` | all providers | Implemented (verified) |
| 2 | Pharmacy dashboard | `/dashboard` | `pharmacy.service.ts` | pharmacy | Implemented (verified) |
| 3 | Medicines (inventory) | `/medicines`, `/new`, `/[id]/edit` | `medicine.service.ts`, `pharmacy.service.ts` | pharmacy | Implemented (verified) |
| 4 | Bulk import / export | `/medicines/import` (+ export button on list) | `pharmacy.service.ts` | pharmacy | Implemented (verified) |
| 5 | Stock and expiry | `/inventory` | `pharmacy.service.ts`, `medicine.service.ts` | pharmacy | Implemented (verified) |
| 6 | Suppliers | `/suppliers` | `pharmacy.service.ts` | pharmacy | Implemented (verified) |
| 7 | Purchases | `/purchases`, `/new`, `/[id]` | `pharmacy.service.ts` | pharmacy | Implemented (verified) |
| 8 | Patient orders | `/orders`, `/orders/[id]` | `order.service.ts` | pharmacy | Implemented (verified) |
| 9 | Prescription requests | `/prescriptions`, `/[id]` | `prescription.service.ts` | pharmacy | Implemented (verified) |
| 10 | Billing (invoices, payments, credit notes) | `/billing`, `/billing/returns/[id]` | `order.service.ts`, `pharmacy.service.ts` | pharmacy | Implemented (verified) |
| 11 | Reports | `/reports` | `pharmacy.service.ts` | pharmacy | Implemented (verified) |
| 12 | Settings and UPI QR | `/settings` | `pharmacy.service.ts` | pharmacy | Implemented (verified) |
| 13 | Notifications | `/notifications` | `notification.service.ts` | pharmacy and lab | Implemented (verified) |
| 14 | Categories | `/categories`, `/categories/new` | `medicine.service.ts` | pharmacy (route reachable by URL only) | Partially implemented |
| 15 | Diagnostic lab console | `/diagnostics`, `/[id]`, `/tests`; lab overview | `diagnostic.service.ts` | `diagnostic_lab` | Implemented (verified) |
| 16 | Google sign-in | none | `auth.service.googleLogin` | - | Partially implemented (no UI) |
| 17 | Profile page | none (`ROUTES.PROFILE` only) | - | - | Documented-but-not-found |

## 1. Authentication

* **Login** (`/login`): zod schema (valid email, non-empty password); calls `POST /auth/medicine/login`; on success stores tokens in cookies and routes to `/dashboard`. Errors are shown via `getApiErrorMessage` toasts. No "forgot password" link or Google button was found.
* **Register** (`/register`): toggle between provider types `medicine_store`, `pharmacy_hospital`, `diagnostic_lab` (stacked on phones). Fields: name (label "Pharmacy Name" or "Lab / Centre Name"), email, phone (optional), password, confirm password, and a **required Google Places location** (address line, city, state, pincode, lat, lng are sent). If Maps is not configured the location control falls back to a plain text field (lat/lng then are null); with Maps, a "Use my current location" button is also offered. Calls `POST /auth/register` with `role` = chosen type.
* Details: `AUTHENTICATION-AND-PERMISSIONS.md`.

## 2. Pharmacy dashboard (`PharmacyOverview`)

Header with greeting and date, reporting-period selector (presets via `PRESETS`, custom from/to dates, a 366-day cap and invalid-range warning), shortcut buttons (Add medicine, Record purchase, Inventory), unread-notification chip. KPI grid (`KpiGrid`) with period comparison and gross margin. Panels: Sales trend, Sales by payment method, Sales vs purchases, Inventory health, Expiry analysis, Top-selling medicines, Orders by status, Fast-moving, Non-moving stock, Supplier analysis, Profit and expenses, Alert centre, Recent orders, Recent purchases, Recent stock movements. Group-by day/week/month is automatic (`autoGroup`) and can be overridden. Data: `GET /medicine/pharmacy/dashboard` (cards, lists) and `GET /medicine/pharmacy/dashboard/analytics?from&to&groupBy`.

## 3. Medicines

* **List** (`/medicines`): search; filters Stock (in/low/out), Expiry (expired/expiring/valid/none), Supplier, Status (active/inactive/all); sort (name, stock, expiry, price, updated; asc/desc); table on desktop and cards on mobile; thumbnail from `primaryImageUrl`; activate/deactivate via confirm dialog (`PUT /medicine/my-medicines/:id` with `isActive`); export to `medicine-inventory.xlsx` (`GET /medicine/pharmacy/export?active=`).
* **Add** (`/medicines/new`): single form with `mode` "existing" (picked from `GET /medicine/masters?search=`) or "new". Price (> 0) and integer stock (>= 0) required; commercial fields (MRP, buying price excl. GST, GST, discount, reorder level, SKU, HSN, pack size, supplier) via `CommercialFields`; batch number required when an expiry date is entered; staged images and substitutes are uploaded to the global medicine after creation. Medicine types offered: tablet, capsule, syrup, injection, drops, cream, ointment, gel, spray, inhaler, powder, other. No category step (existing category data is kept but not asked for).
* **Edit** (`/medicines/[id]/edit`): shared (global) fields are read-only; commercial fields, location and stock are editable. Stock can be received as a new batch (`POST /medicine/pharmacy/inventory/:id/stock`), a batch edited (`PUT .../batches/:batchId`), or set directly via `PUT /medicine/my-medicines/:id` with `stock` and `stockNote`. A paginated **stock movement ledger** (10 per page, filter by movement type) is loaded from `GET .../inventory/:id/movements`. `MedicineMediaSection` manages global images (upload, delete, make primary via reorder) and substitutes.
* Movement types shown: opening, purchase, purchase cancelled, sale, order cancelled/rejected, customer return, manual adjustment, Excel import, expired written off.

## 4. Bulk import

Four-step stepper (Upload file, Validate and preview, Import, Report). Duplicate strategy `skip` (default) or `update`. Template download is `medicine-import-template.xlsx`. Preview writes nothing (`POST .../import/preview`, multipart); commit is `POST .../import`. After import the `my-medicines` and `pharmacy-dashboard` queries are invalidated. The UI states that images are not part of the file.

## 5. Stock and expiry

Tabs (URL `?tab=`): Expiring soon, Expired, All batches, Low stock, Out of stock. Batch tabs use `GET /medicine/pharmacy/batches` with an "Expiring within" selector; low/out tabs reuse `GET /medicine/my-medicines?stockStatus=`. "Write off expired stock" (`POST /medicine/pharmacy/batches/write-off-expired`) behind a confirm dialog.

## 6. Suppliers

List with search and active filter, create/edit through `SupplierDialog`, activate/deactivate, purchase count linking to `/purchases?supplierId=`. Endpoints `GET/POST /medicine/pharmacy/suppliers`, `PUT .../suppliers/:id`. No delete action exists.

## 7. Purchases

* **List** with filters (supplier via query string, etc.), **New** (`/purchases/new`: supplier, supplier invoice number and invoice date required, line items found through catalogue search, with batch/expiry/prices), **Detail** (`/purchases/[id]`: print via `window.print()`, cancel purchase). Cancel is `POST .../purchases/:id/cancel`; the backend refuses if stock was sold (per old docs; the frontend shows the server error). After changes the `purchases`, `my-medicines`, `batches`, `pharmacy-dashboard` queries are invalidated.

## 8. Patient orders

* **List** (`/orders`): status tabs (All plus every status), search, payment status, payment method, order-date range (`DayRangeFilter`). Uses **order groups** (`GET /medicine/orders/groups/provider`): one checkout is one order/bill per pharmacy.
* **Detail** (`/orders/[id]`): items, totals, patient info, status buttons from `ORDER_NEXT_STATUS`, "Mark payment received" for UPI-QR unpaid orders, tax invoice view (`InvoiceView`, from `GET .../groups/:id/invoice`), print, previous credit notes, and **Record a return** dialog (per-line return quantity limited to sold minus returned, reason, "put units back on the shelf" switch; server computes the refund).
* Status labels: pending "Order Placed", confirmed, processing "Preparing", shipped "Out for Delivery", on_the_way "On the Way", delivered, rejected, cancelled. Payment: pending "Unpaid", paid, failed, refunded. Methods: `cod`, `online` (shown as "Online (simulated)"), `upi_qr`.

## 9. Prescription requests

List with status tabs (All, Pending, Viewed, Processing, Completed, Rejected). Detail loads the request, up to 100 of the pharmacy's own medicines, and the file as a blob. The pharmacy ticks medicines with quantity and/or adds "unavailable" rows (name and optional reason), then submits (`availability`) or rejects. At least one item is required to submit.

## 10. Billing

Three tabs: **Invoices** (order groups with payment filter; row opens the order), **Payments** (`GET /medicine/pharmacy/payments` filtered by status and method), **Returns / credit notes** (`GET /medicine/pharmacy/returns`; row opens `/billing/returns/[id]` which can be printed). No separate invoice table; an invoice is derived from the order (backend design, per `frontend-mr/docs/feature-history/pharmacy-management-09-10-2026`).

## 11. Reports

Tabs Sales (group by day/week/month, KPIs: orders, net sales incl. GST, GST in sales, refunds), Top medicines (limit 20), Purchases, GST (output GST, credit-note reversals, input GST, indicative net), Stock (valuation at cost and selling price, low/out counts). Period selector via `DayRangeFilter` (default 30 days; the stock tab takes no range). No export of reports was found.

## 12. Settings

`PharmacyStoreSettings`: GSTIN (upper-cased, validated), drug licence number, "expiring soon" window (days), invoice footer note (`GET/PUT /medicine/pharmacy/settings`). `PaymentQrCard`: UPI id, payee name, active toggle, upload/remove QR image (`/medicine/pharmacy/payment-qr`, `/payment-qr/image`). Saving settings invalidates all queries.

## 13. Notifications

Paginated cards (limit 20) with read/unread state, mark one read, mark all read, and an unread count. Fetched on page load only; no polling interval or socket client exists in the app.

## 14. Categories

Pages exist: list with debounced search of the **global** category list (`GET /medicine/my-categories`) and a "new" form (`POST`, find-or-create; the backend generates the slug). The sidebar item is commented out in `nav.ts`, and no delete exists. `ROUTES.CATEGORIES` is in `PHARMACY_ONLY_ROUTES`.

## 15. Diagnostic lab console

* **Overview** (`LabOverview`): KPI tiles and 5 latest requests.
* **Requests** (`/diagnostics`): status tabs over `DIAGNOSTIC_STATUSES`, list from `GET /diagnostics/requests/incoming`.
* **Request detail** (`/diagnostics/[id]`): patient info, prescription file (blob), `AnswerEditor` to mark each test available (with price) or unavailable (with reason) from the lab's catalogue or free text and send (`PUT .../response`), status actions (confirm booking, reject, mark test completed with confirm dialogs), `ReportsCard` to upload report files tied to specific tests (file types lab report, X-Ray, MRI, other) and open them as blobs.
* **Tests** (`/diagnostics/tests`): catalogue CRUD (name, description, price, available toggle) via `GET/POST /diagnostics/tests`, `PUT/DELETE /diagnostics/tests/:id`.

## Cross-cutting

| Concern | Implementation |
|---|---|
| Empty/error/loading | `EmptyState`, `ErrorState` (with retry), `Loading` |
| Toasts | `sonner` (top-right) |
| Confirmations | `ConfirmDialog` |
| Pagination | `Pagination` (MUI, hides when 1 page) |
| Mobile | cards instead of tables, temporary drawer below `md` |
| Printing | `window.print()` on invoice, credit note, purchase |
| File downloads | blob + object URL (`xlsx` template/export, prescriptions, reports) |
