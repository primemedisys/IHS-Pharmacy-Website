# Medicine Auth Redirect Loop Fix — 2026-09-22

## Medicine Authentication Redirect Loop

### Symptoms
- Registration reports success
- Page starts BLINKING / RELOADING repeatedly
- Login page appears again after successful registration
- Dashboard does not stay open
- Redirect loops: dashboard → login → dashboard → login

### Actual Root Cause

**Two bugs working together:**

**Bug 1 (PRIMARY — redirect loop):** `authService.getMe()` in `frontend-mr/src/services/auth.service.ts:36` returned `data.data.user`, but the `/auth/me` backend endpoint returns the serialized user directly as `data.data` (NOT nested under `.user`).

The register/login endpoints return `{ user, tokens }` wrapped in `data`, so `data.data.user` works for them. But `/auth/me` calls `ok(res, serializeUser(user))` which puts the user directly as `data` — no `.user` wrapper.

Result: `getMe()` returned `undefined`. The AuthProvider set `setUser(undefined)`. The DashboardShell's route guard `if (!loading && !user) router.replace(ROUTES.LOGIN)` redirected back to login, creating the loop.

**Bug 2 (SECONDARY — 403 on all dashboard APIs):** All medicine route files used `authorize([ROLES.MR, ROLES.MEDICINE_STORE])` (array syntax), but the `authorize` middleware uses rest parameters `(...roles)`. This wrapped the array in another array: `roles` = `[["mr", "medicine_store"]]`. The check `roles.includes(req.user.role)` always returned false → 403 Forbidden.

Every other route in the codebase used the correct spread syntax: `authorize(ROLES.DOCTOR)`.

### Auth Flow Problem

```
Register → success → setUser(validUser) → router.push("/dashboard")
    ↓
AuthProvider useEffect fires (pathname changed to /dashboard)
    ↓
Calls getMe() → returns UNDEFINED (data.data.user doesn't exist)
    ↓
setUser(undefined) → user state becomes undefined
    ↓
DashboardShell: !loading && !user → router.replace("/login")
    ↓
Navigate to /login → AuthProvider useEffect fires again
    ↓
getMe() returns undefined again → user stays undefined
    ↓
Login page shown → USER SEES LOGIN AGAIN
```

### LOGIN 401

Not the root cause of the redirect loop. Login actually succeeds — the problem is that after login, the user state is immediately overwritten to undefined by the broken `getMe()` call.

### /api/auth/me

**Before fix:** Returns user object directly as `data.data`:
```json
{ "success": true, "data": { "id": "72", "name": "Test", "role": "mr", ... } }
```
Frontend read `data.data.user` → `undefined`

**After fix:** Frontend reads `data.data` → `{ id: "72", name: "Test", role: "mr", ... }` ✓

### REDIRECT LOOP

The `DashboardShell` component at `frontend-mr/src/features/dashboard/components/DashboardShell.tsx:44`:
```tsx
useEffect(() => {
    if (!loading && !user) router.replace(ROUTES.LOGIN);
}, [loading, user, router]);
```

This is CORRECT behavior for an unauthenticated user. The problem was that `getMe()` returned undefined, making a valid authenticated user appear unauthenticated.

### DASHBOARD

Dashboard did not stay open because:
1. AuthProvider's bootstrap useEffect called `getMe()` on every pathname change
2. `getMe()` returned `undefined` due to wrong response path
3. `setUser(undefined)` cleared the valid user
4. DashboardShell detected `!user` and redirected to login

### FILES CHANGED

| File | Change |
|------|--------|
| `frontend-mr/src/services/auth.service.ts` | Fixed `getMe()` to return `data.data` instead of `data.data.user` |
| `backend/src/routes/medicineStore.routes.js` | Fixed `authorize([roles])` → `authorize(...roles)` |
| `backend/src/routes/medicineOrder.routes.js` | Fixed `authorize([roles])` → `authorize(...roles)` |
| `backend/src/routes/medicineNotification.routes.js` | Fixed `authorize([roles])` → `authorize(...roles)` |

### FIX

**Fix 1 — `frontend-mr/src/services/auth.service.ts`:**
```diff
  async getMe(): Promise<User> {
    const { data } = await apiClient.get(API_ENDPOINTS.AUTH_ME);
-   return data.data.user;
+   return data.data;
  },
```

**Fix 2 — All medicine backend route files:**
```diff
- authorize([ROLES.MR, ROLES.MEDICINE_STORE]),
+ authorize(ROLES.MR, ROLES.MEDICINE_STORE),
```

The `authorize` function signature is `(...roles) => ...` (rest params). Passing an array `[roles]` wraps it in another array. All other routes in the codebase use `authorize(ROLES.DOCTOR)` (no array).

### TEST RESULTS

Medicine Representative:
- Register: ✅ Success, role: mr
- Login: ✅ Success, role: mr
- /auth/me: ✅ Returns user (data.data = user object)
- Dashboard stats APIs: ✅ All return 200 (my-medicines, provider-orders, unread-count)
- Frontend build: ✅ Compiled successfully

Medicine Store:
- Register: ✅ Success, role: medicine_store
- Login: ✅ Success, role: medicine_store
- /auth/me: ✅ Returns user
- Dashboard stats APIs: ✅ All return 200
- Admin login (no regression): ✅ Pre-existing 401 (wrong test credentials, not our change)

### REMAINING ISSUES

None related to this fix. The admin 401 is pre-existing (incorrect test credentials, not affected by any medicine route changes).
