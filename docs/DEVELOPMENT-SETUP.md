# Development Setup

## Prerequisites

* A Node.js version supported by Next.js 16 / React 19 (no `engines` field is declared here; use a current LTS).
* npm (the folder has `package-lock.json`).
* A running IHS backend (Express + MySQL) reachable from your browser, and an account of a provider role to log in with. Backend setup is documented with the backend (`docs-shared/`); typical local URL: `http://localhost:5000/api`.
* Optional: a Google Maps browser key if you want the live location search on the register page.

## Steps

```bash
cd frontend-mr
cp .env.example .env.local
# edit NEXT_PUBLIC_API_URL (and optionally NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
npm install
npm run dev          # http://localhost:3004
```

Notes on the scripts (from `package.json`):

* `predev` is `npm install`, so `npm run dev` always installs first (slow on every start; this is how the project is configured).
* `dev` = `next dev -p 3004`; `start` = `next start -p 3004`.
* `lint` = `eslint .` with `eslint-config-next` core-web-vitals and TypeScript rules. There is no `typecheck` script; use `npx tsc --noEmit` (the project's older docs report `tsc` clean runs).

## First run

1. Open `http://localhost:3004/` - `/` currently redirects to `/login` (see routing note about the duplicate `/` page).
2. Register a provider (`/register`): choose Pharmacy Medicine Store / Clinic, Pharmacy Hospital or Diagnostic Lab Center, fill name, email, optional phone, password, and pick a location. Without a Maps key the location control is a plain text field.
3. After registering you are signed in and taken to `/dashboard`.
4. Pharmacy flow smoke path: Add Medicine -> Record Purchase (needs a supplier from Suppliers) -> see stock in Stock & Expiry -> orders appear when a patient (patient web/app) orders from you.

## Working with the code

* Path alias `@/` -> `src/`.
* New backend endpoint: add to `src/config/api.ts`, add a method in the relevant `src/services/*.service.ts`, type it in `src/types/index.ts`, then use `useQuery` (preferred in this codebase for lists) and invalidate affected keys after writes (see `STATE-AND-DATA-FETCHING.md`).
* New sidebar page: add the route in `src/constants/routes.ts`, the nav entry in `src/features/dashboard/nav.ts`, and decide whether `PHARMACY_ONLY_ROUTES`/`LAB_ONLY_ROUTES` should include it.
* Use theme tokens and shared components (see `COMPONENTS.md`); the React Compiler is enabled, so avoid mutating values read during render and prefer not to use non-null assertions on nullable state inside callbacks (a project note records a crash pattern with `x!.id`).
* The theme is meant to match the other IHS portals; if the design system changes, it is copied rather than imported (no shared package).

## Local conflicts and quirks

* Another local project may already use port 5000; point `NEXT_PUBLIC_API_URL` at the actual backend.
* If you run several IHS portals, they use different ports (patient 3000, doctor 3001, admin 3002, clinic 3003, this app 3004, per `.env.example` defaults).
* Cookies are set without a `domain` and browsers do not isolate cookies by port, so another IHS portal on the same host name (for example the patient portal on `localhost:3000`) reads and overwrites the same `access_token`/`refresh_token` cookies. Log in to one portal at a time per browser profile, or use a different host name (`doctor.localhost` style) to separate them. Hosts with different names (`doctor.localhost:3001`) do not share cookies.
* Stop any older dev server on 3004 before starting; stale `next dev` processes can serve broken routes.
