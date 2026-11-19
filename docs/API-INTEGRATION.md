# API Integration

All HTTP goes through `src/utils/apiClient.ts` using endpoints from `src/config/api.ts` and the service modules in `src/services/`. Base URL: `NEXT_PUBLIC_API_URL` (the backend `/api` prefix is part of the URL, for example `http://localhost:5000/api`). Backend route files cross-checked read-only in `backend/src/routes/` (`auth`, `medicineStore`, `medicineOrder`, `medicineNotification`, `prescriptionRequest`, `pharmacy`, `diagnostic`, mounted in `routes/index.js`).

## Client behaviour

| Aspect | Behaviour (verified in `apiClient.ts`) |
|---|---|
| Base | `axios.create({ baseURL, withCredentials: true, headers: Content-Type application/json })` |
| Auth header | request interceptor: `Authorization: Bearer <cookie access_token>` if present |
| 401 handling | response interceptor: for a 401 that is not on `/auth/medicine/login`, `/auth/medicine/google`, `/auth/register` or `/auth/refresh` and not yet retried, reads the `refresh_token` cookie, calls `POST {API_BASE_URL}/auth/refresh` with `{ refreshToken }` using bare `axios`, stores the new `accessToken` (cookie, 1 day) and `refreshToken` (7 days), replays the request. On failure or no refresh token: clears cookies and sets `window.location.href = "/login"` |
| Auth-endpoint 401 | passed to the caller so the form can show "wrong password" |
| Success envelope | services unwrap `response.data.data` (some use `data.data.request`, `.user`, `.tokens` etc.) |
| Error envelope | `{ error: { message, code, details } }` (see `getApiErrorMessage`): prefers `error.message` unless it equals "Validation failed", then the first field detail, then `data.message`, then the supplied fallback |
| Lists | typed as `PaginatedResponse<T>` (`{ total, page, limit, totalPages }` plus a named array such as `medicines`, `orders`, `notifications`) or the generic `Page<key, T>` |
| Files | `responseType: "blob"` + object URL (prescription, diagnostic file/report, xlsx template/export); uploads via `FormData` (field names `file`, `report`, and images) |

## Endpoints consumed by pages

"Backend" column = matching route found in `backend/src/routes` and its authorisation (provider roles = the medicine provider role list including legacy `mr`; `diagnostic_lab` is separate).

### Auth (`auth.service.ts`)

| Method and path | Used by | Backend |
|---|---|---|
| `POST /auth/medicine/login` | login | `auth.routes.js` (rate-limited `authLimiter`) |
| `POST /auth/register` | register | `auth.routes.js` (`signupLimiter`) |
| `GET /auth/me` | AuthProvider bootstrap | authenticated |
| `POST /auth/logout` | logout | authenticated |
| `POST /auth/refresh` | interceptor | `refreshLimiter` |
| `POST /auth/medicine/google` | `authService.googleLogin` (no caller in UI) | exists |

### Medicines and catalogue (`medicine.service.ts`)

| Method and path | Purpose | Backend roles |
|---|---|---|
| `GET /medicine/my-medicines` | list own inventory (params: search, category, form, stockStatus, expiry, supplierId, active, sort, order, page, limit) | providers |
| `GET /medicine/my-medicines/:id` | one inventory row | providers |
| `POST /medicine/my-medicines` | create (`medicineMasterId` or full new medicine plus commercial fields) | providers |
| `PUT /medicine/my-medicines/:id` | update commercial data, `isActive`, `stock`/`stockNote`, `location` | providers |
| `DELETE /medicine/my-medicines/:id` | `medicineService.remove` (no page caller found) | providers |
| `GET /medicine/masters?search&limit` | search global catalogue | providers |
| `GET /medicine/masters/:id/media` | images + substitutes | providers and admin |
| `POST /medicine/masters/:id/images` | upload image (multipart) | providers and admin |
| `DELETE /medicine/masters/:id/images/:imageId` | delete image | uploader/admin per backend note |
| `PUT /medicine/masters/:id/images/order` | reorder (`imageIds`; first = primary) | providers and admin |
| `PUT /medicine/masters/:id/substitutes` | replace substitute set (`substituteIds`) | providers and admin |
| `GET /medicine/my-categories?search` | global categories | providers |
| `POST /medicine/my-categories` | find-or-create category | providers |

### Pharmacy management (`pharmacy.service.ts`; the whole `/medicine/pharmacy` router requires authentication and a medicine provider role)

| Method and path | Purpose |
|---|---|
| `GET /medicine/pharmacy/dashboard` | cards and recent lists |
| `GET /medicine/pharmacy/dashboard/analytics` | charts (`from`, `to`, `groupBy`) |
| `GET /medicine/pharmacy/reports/sales`, `/top-medicines`, `/purchases`, `/gst`, `/stock` | report tabs |
| `GET /medicine/pharmacy/batches` | batches by expiry status |
| `POST /medicine/pharmacy/batches/write-off-expired` | write off expired (optional `inventoryId`) |
| `POST /medicine/pharmacy/inventory/:id/stock` | receive stock as a batch |
| `PUT /medicine/pharmacy/inventory/:id/batches/:batchId` | edit batch quantity/expiry/note |
| `GET /medicine/pharmacy/inventory/:id/movements` | stock ledger |
| `GET /medicine/pharmacy/import/template` | xlsx template |
| `POST /medicine/pharmacy/import/preview`, `POST /medicine/pharmacy/import` | multipart `file`, `duplicateStrategy` |
| `GET /medicine/pharmacy/export?active=` | inventory xlsx |
| `GET/POST /medicine/pharmacy/suppliers`, `PUT /medicine/pharmacy/suppliers/:id` | suppliers (a `GET /suppliers/:id` route exists, unused) |
| `GET/POST /medicine/pharmacy/purchases`, `GET /purchases/:id`, `POST /purchases/:id/cancel` | purchases |
| `POST /medicine/pharmacy/orders/:id/returns` | create return/credit note (`:id` = order group id) |
| `GET /medicine/pharmacy/returns`, `GET /returns/:id` | credit notes |
| `GET /medicine/pharmacy/payments` | payment records |
| `GET/PUT /medicine/pharmacy/settings` | GSTIN, licence, expiry window, note |
| `GET/PUT/DELETE /medicine/pharmacy/payment-qr`, `POST /payment-qr/image` | UPI QR |

### Orders (`order.service.ts`)

| Method and path | Purpose | Backend roles |
|---|---|---|
| `GET /medicine/orders/groups/provider` | provider's order groups | providers |
| `GET /medicine/orders/groups/:id` | order group detail | patient and providers |
| `PUT /medicine/orders/groups/:id/status` | status change `{ status }` | providers |
| `POST /medicine/orders/groups/:id/payment/confirm-received` | UPI-QR payment confirmation | providers |
| `GET /medicine/orders/groups/:id/invoice` | tax invoice data | patient and providers |

Defined in `order.service.ts` but with no page caller found: `getProviderOrders` (`GET /medicine/orders/provider-orders`), `getOrder` (`GET /medicine/orders/:id`), `updateStatus` (`PUT /medicine/orders/:id/status`) - the older per-order API; the legacy `(dashboard)/page.tsx` stats page calls `provider-orders` directly.

### Prescription requests (`prescription.service.ts`)

| Method and path | Purpose |
|---|---|
| `GET /medicine/prescriptions/provider-requests` | list (status filter, paging) |
| `GET /medicine/prescriptions/:id` | detail |
| `PUT /medicine/prescriptions/:id/status` | e.g. `rejected` |
| `PUT /medicine/prescriptions/:id/availability` | `{ items }` where each item is either `{status:"available", medicineId, quantity}` or `{status:"unavailable", medicineName, reason?}` |
| `GET /medicine/prescriptions/:id/file` | authenticated blob |

### Notifications (`notification.service.ts`)

`GET /medicine/notifications` (page, limit, unreadOnly), `GET /medicine/notifications/unread-count`, `PUT /medicine/notifications/:id/read`, `PUT /medicine/notifications/read-all`. Backend allows patients, providers and `diagnostic_lab`. A `DELETE /medicine/notifications/:id` route exists; the app does not call it.

### Diagnostics (`diagnostic.service.ts`; all `diagnostic_lab` only except the participant reads)

| Method and path | Purpose |
|---|---|
| `GET /diagnostics/summary` | KPI counts (`total`, `byStatus`) |
| `GET /diagnostics/requests/incoming` | request list |
| `GET /diagnostics/requests/:id` | detail (patient or lab) |
| `PUT /diagnostics/requests/:id/status` | `{ status, note? }` |
| `PUT /diagnostics/requests/:id/response` | answers per test + optional note |
| `POST /diagnostics/requests/:id/reports` | multipart: `report`, `testIds[]`, `fileType` |
| `GET /diagnostics/requests/:id/file` | prescription blob |
| `GET /diagnostics/requests/:id/tests/:testId/report` | report blob |
| `GET/POST /diagnostics/tests`, `PUT/DELETE /diagnostics/tests/:id` | lab test catalogue |

## Registered in `API_ENDPOINTS` but not called by this app

`AUTH_REFRESH` (the interceptor builds the URL itself), `MEDICINE_BROWSE`, `MEDICINE_CATEGORIES`, `MEDICINE_DETAILS`, `PROVIDER_PROFILE`, `ORDERS`, `MY_ORDERS`, `ORDER_CANCEL` and (after the group migration) the per-order helpers noted above. These are public/patient routes used by the patient app. Do not rely on them from this repo.

## Dashboard shortcut calls outside services

The legacy `(dashboard)/page.tsx` calls `apiClient.get` directly for `/medicine/my-medicines`, `/medicine/orders/provider-orders` and `/medicine/notifications/unread-count`.

## Discrepancy noted

The old fix note `frontend-mr/docs/feature-history/medicine-login-dashboard-fix-22-09-2026` says `/auth/me` returns the user directly as `data.data`; current `getMe()` returns `data.data`, consistent. Login uses `/auth/medicine/login` (a dedicated endpoint), not the generic `/auth/login`.
