# Troubleshooting

| Symptom | Likely cause | What to check / do |
|---|---|---|
| App crashes at start with "NEXT_PUBLIC_API_URL must be set in .env to a valid URL" | Missing or non-URL value (schemeless values fail `z.string().url()`) | Set `NEXT_PUBLIC_API_URL=http://localhost:5000/api`; restart dev server |
| Changed an env var but nothing changed in production | `NEXT_PUBLIC_*` is inlined at build time | Rebuild |
| Every API call fails / network error | Backend down, wrong URL/port, CORS | Open the browser network tab; confirm the URL ends with `/api`; check backend CORS allows `http://localhost:3004` |
| Logged out immediately after login (loop between dashboard and login) | `/auth/me` response shape or 403 on role routes (historical cause documented 2026-09-22) | Check `GET /auth/me` returns the user in `data`; the account's role must be a provider-portal role |
| Wrong password shows no message or page flashes | Auth-endpoint 401 is excluded from refresh and should show a toast | Check the request URL matches the excluded list in `apiClient.ts` (`/auth/medicine/login`, `/auth/medicine/google`, `/auth/register`, `/auth/refresh`) |
| Kicked to `/login` repeatedly | Refresh failed (expired/rotated refresh token) or cookies cleared | Log in again; confirm cookies `access_token` and `refresh_token` exist for the host |
| Logging in on another IHS portal logs this one out/in | Cookies are shared by host name across ports | Use different host names or separate browser profiles (see `DEVELOPMENT-SETUP.md`) |
| Location field on Register is a plain text box | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` blank | Add a key; for billing/referrer errors check Google Cloud (Places needs billing; a key without billing yields Maps errors and no suggestions) |
| Register says to select location from the dropdown | Location state empty | Choose a suggestion, use "Use my current location", or type text when Maps is disabled |
| 403 on medicine routes | Account role is not a medicine provider role | Lab accounts cannot call pharmacy routes; the UI redirects them but direct calls fail |
| Sidebar item missing (Categories) | Intentionally commented out in `nav.ts` | Open `/categories` by URL if needed |
| Lab user redirected from `/medicines` to dashboard | `canAccessRoute` guard | Expected |
| Prescription/report file area empty | Blob download failed (401/403/404) | Check the network call to `/medicine/prescriptions/:id/file` or `/diagnostics/requests/:id/file`; sign in again |
| Prescription detail does not show all my medicines | Page loads only the first 100 inventory rows (`limit: 100`) | Known limitation |
| Prescription submit error toast is generic | That page reads `error.response.data.message`, but the backend envelope is `error.message` | Look at the response body in the network tab |
| `/` behaves oddly or build complains about two pages for `/` | `app/page.tsx` and `app/(dashboard)/page.tsx` both map to `/` | See `KNOWN-LIMITATIONS-AND-DISCREPANCIES.md`; use `/dashboard` |
| Dashboard charts empty | Date range invalid (> 366 days or from > to) or no data | Pick a valid period; analytics query is disabled when invalid |
| UPI "Mark payment received" button missing | Only shown when method is `upi_qr`, payment `pending` and order not cancelled | Check the order's payment fields |
| Status button missing on an order | Terminal or no allowed next status in `ORDER_NEXT_STATUS` | Backend validates transitions too |
| Import preview shows errors | Row validation by backend | Fix the sheet using the downloaded template; images are not part of the file |
| Port 3004 in use or stale routes returning 500 | Orphaned `next dev` process | Stop the old process and restart |
| Dev start is slow | `predev` runs `npm install` every time | Expected per `package.json` |

## Debug tips

* All requests go through `apiClient`; add temporary logging in the interceptors rather than in pages.
* The `getApiErrorMessage` helper hides the original error; inspect `err.response.data` in the console for the backend `error.code` and `details`.
* Check `.next/` is not stale after changing env or `next.config.ts` (delete the folder locally and rebuild).
