# Environment Configuration

Source of truth: `src/config/env.ts` (zod schema) and `.env.example`. Only `.env.example` was read for this document; real `.env` values are deliberately not reproduced.

## How it works

* Every variable is `NEXT_PUBLIC_*`, which Next.js **inlines into the client bundle at build time**. Changing a value requires a rebuild (`npm run build`); editing it on a running production server has no effect.
* `env.ts` maps each variable explicitly (`process.env.NEXT_PUBLIC_X`) because Next only inlines literal references. Do not refactor it to pass `process.env` wholesale.
* The schema is parsed at import time. A missing/invalid `NEXT_PUBLIC_API_URL` throws a zod error ("NEXT_PUBLIC_API_URL must be set in .env to a valid URL") and the app fails to render.
* `.env.example` says to copy it to a local env file; `.gitignore` ignores `.env`, `.env.production`, `.env.development` and `.env*.local`. Use `.env.local` for development.

## Variables

| Name | Required | Default in schema | Used by | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes (valid URL) | none | `config/api.ts` -> `apiClient` | Backend base URL including `/api`, e.g. `http://localhost:5000/api` |
| `NEXT_PUBLIC_APP_NAME` | No | `Indian Health System - Medicine Portal` | `config/site.ts` (metadata title/OG) | Display name |
| `NEXT_PUBLIC_ENV` | No | `development` (enum `development`, `staging`, `production`) | validated only | No code branches on it were found |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | `""` | none (Google button not implemented) | Would enable Google sign-in |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | `""` | `ProviderLocationAutocompleteInner` via `env.isMapsEnabled`/`googleMapsApiKey` | Places search on register. Blank = plain-text location fallback. Per `.env.example`: enable Maps JavaScript, Places and Geocoding APIs; restrict by HTTP referrer |
| `NEXT_PUBLIC_COOKIE_DOMAIN` | No | `localhost` | none (cookies are set without a domain) | Intended shared parent domain for SSO; not applied |
| `NEXT_PUBLIC_PATIENT_URL` | No | `http://localhost:3000` | none found | Other portal URL |
| `NEXT_PUBLIC_DOCTOR_URL` | No | `http://doctor.localhost:3001` | none found | Other portal URL |
| `NEXT_PUBLIC_ADMIN_URL` | No | `http://admin.localhost:3002` | none found | Other portal URL |
| `NEXT_PUBLIC_CLINIC_URL` | No | `http://clinic.localhost:3003` | none found | Other portal URL |
| `NEXT_PUBLIC_MR_URL` | No | `http://localhost:3004` | `config/site.ts` (`metadataBase`, OG url) | This app's own public URL |

Derived values exported from `env.ts`: `env.googleMapsApiKey`, `env.isMapsEnabled` (key length > 0).

## Example (placeholders)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Indian Health System - Medicine Portal
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-restricted-maps-browser-key>
NEXT_PUBLIC_COOKIE_DOMAIN=localhost
NEXT_PUBLIC_MR_URL=http://localhost:3004
```

## Ports

The dev and start scripts bind port **3004** (`-p 3004`). The `.env.example` header agrees. (A project note says `:5000` is sometimes occupied by another local project; set `NEXT_PUBLIC_API_URL` to whatever port the IHS backend really uses.) Under the standalone server the port comes from the `PORT` environment variable instead (see `DEPLOYMENT-GUIDE.md`).

## Backend dependencies on configuration

The browser calls the backend directly, so the backend's CORS configuration must allow this app's origin (backend `CLIENT_URL`-style settings; not verified here). Video/SMS/storage settings are backend-only and irrelevant to this app.

## Security notes

* Never put secrets in `NEXT_PUBLIC_*`; they are public by design.
* A Google Maps browser key must be referrer-restricted. The platform audit (`docs-shared/legacy/PRODUCTION-READINESS-AUDIT.md`) records that a real key was committed in this folder's tracked `.env`; rotate/restrict it and untrack the file.
