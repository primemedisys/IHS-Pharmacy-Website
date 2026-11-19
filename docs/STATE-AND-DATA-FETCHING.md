# State and Data Fetching

## State layers

| Layer | Tool | What it holds |
|---|---|---|
| Server state | TanStack Query 5 (`QueryProvider`) | lists, details, dashboards, reports |
| Auth state | React context (`AuthProvider`, `useAuth`) | `user`, `loading`, `login`, `register`, `logout`, `setUser` |
| Form state | React Hook Form (`useForm`) on login, register, add/edit medicine, new category, and `CommercialFields`; plain `useState` on the other forms (settings, purchases/new, suppliers dialog, QR card, return dialog) | |
| UI state | `useState` per page (filters, page number, dialogs, tabs) | |
| URL state | `useSearchParams` for tab/filter on Inventory (`?tab=`), Purchases (`?supplierId=`), Orders | |
| Theme | MUI colour scheme (class on `<html>`), no store | |

No Redux/Zustand. No socket or polling layer.

## Query client defaults

`QueryProvider` creates one `QueryClient` per mount with `staleTime: 60_000` (1 minute) and `retry: 1`. React Query devtools are installed but not mounted.

## Mixed fetching styles

Two styles coexist (both verified):

1. **`useQuery`** (newer pharmacy pages): inventory, medicines list, orders, billing, purchases, reports, settings, suppliers, dashboard, QR card, movement ledger. Typically `placeholderData: keepPreviousData` for paging/filter changes.
2. **`useEffect` + `useState`** (older pages): notifications, categories, prescription detail, diagnostics detail, diagnostics tests, lab overview, legacy stats page. These do not share the cache. The project memory and old docs note a StrictMode caveat for mount-effect callbacks; where reads happen in effects here they call services directly.

## Query keys in use

| Key (first element) | Where | Invalidated by |
|---|---|---|
| `["my-medicines", params]` | medicines list, inventory low/out tabs | status toggle, import, order status, purchases, write-off, edit |
| `["my-medicine", id]` | edit page | edit actions |
| `["movements", id, page, type]` | edit page ledger | edit actions |
| `["suppliers", params]`, `["suppliers","all"]`, `["suppliers","active"]` | suppliers, filters, purchase form, commercial fields | supplier dialog / toggle |
| `["batches", params]` | inventory | write-off, purchases |
| `["purchases", params]`, `["purchase", id]` | purchases pages | create/cancel |
| `["order-groups", params]`, `["order-groups","billing",params]`, `["order-group", id]`, `["invoice", id]` | orders, billing, detail | status change, payment confirmation, returns |
| `["payments", params]`, `["returns", params]`, `["return", id]` | billing | order actions |
| `["pharmacy-dashboard"]`, `["pharmacy-dashboard-analytics", from, to, groupBy]` | dashboard | most mutations invalidate `pharmacy-dashboard` |
| `["report", key, ...deps]` | reports tabs (`useReport`) | none (period change refetches) |
| `["pharmacy-settings"]`, payment-QR key | settings | `queryClient.invalidateQueries()` (all) after saving settings; QR uses `setQueryData` |

Invalidations are explicit lists of keys after each mutation (for example `["order-groups","pharmacy-dashboard","my-medicines"]` after an order status change, because stock may be restored on reject/cancel).

## Mutations

There is no `useMutation` usage; writes are `async` handlers calling a service, then `toast.success/error` and `invalidateQueries`. Consequence: loading flags are per-page `useState` (`saving`, `updating`, `busy`, `submitting`).

## Pagination and filters

* Server-side pagination everywhere (`page`, `limit`), UI via `components/ui/Pagination`.
* Filter changes reset `page` to 1 in handlers.
* Debounced search was found in the categories page, the Add Medicine catalogue search and the purchase-line medicine search; other pages pass the (trimmed) search value straight to the query.
* Dates are `YYYY-MM-DD` strings (`DayRangeFilter`, `todayDay()`), formatted with `formatDay`; currency via `formatCurrency` (rupees).

## Auth state specifics

`AuthProvider` re-runs `GET /auth/me` whenever `pathname` changes, so each client-side navigation triggers a `/auth/me` request (no caching). Cookies are the source of truth for "is signed in"; `user` is derived state.

## Errors

`getApiErrorMessage(err, fallback)` is used by most pages. Exceptions that still read `err.response.data.message` directly: prescription detail submit/reject handlers, which therefore show the generic fallback for envelope errors.

## Object URLs

Blob URLs are revoked on cleanup in the diagnostics detail page, `ReportsCard` and the Add Medicine image previews, and after a short timeout for downloaded xlsx files. The prescription detail page creates its blob URL on load; no `revokeObjectURL` call was found for it.
