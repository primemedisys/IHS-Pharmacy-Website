# Tech Stack and Dependencies

Source: `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`. "Importers" is the number of files under `src/` that reference the package (checked by search).

## Core platform

| Item | Version | Notes |
|---|---|---|
| Next.js | 16.2.9 | App Router; `reactCompiler: true`; `output: "standalone"` |
| React / React DOM | 19.2.4 | |
| TypeScript | ^5 | `strict: true`, alias `@/*` -> `src/*` |
| `babel-plugin-react-compiler` | 1.0.0 | dev dependency |
| ESLint | ^9 + `eslint-config-next` 16.2.9 | flat config; ignores `.next`, `out`, `build` |
| Node | not pinned | no `engines` field or `.nvmrc` in this folder; Next 16 requires a recent Node (check Next's docs) |

## Runtime dependencies

| Package | Version | Importers | Use |
|---|---|---|---|
| `@mui/material` | ^9.1.2 | many | UI components, theme (CSS variables engine, `colorSchemeSelector: "class"` used via `InitColorSchemeScript attribute="class"`) |
| `@emotion/react`, `@emotion/styled` | ^11.14 | peer | MUI styling |
| `@mui/x-charts` | ^9.18.0 | 1 (`PharmacyOverview`) | dashboard charts |
| `@tanstack/react-query` | ^5.101.2 | many | server-state caching |
| `@tanstack/react-query-devtools` | ^5.101.2 | 0 | installed, not mounted |
| `axios` | ^1.18.1 | `apiClient.ts`, refresh call | HTTP |
| `react-hook-form` | ^7.80.0 | forms | forms |
| `@hookform/resolvers` | ^5.4.0 | forms | zod resolver |
| `zod` | ^4.4.3 | env + forms | validation |
| `sonner` | ^2.0.7 | ~29 | toasts |
| `react-icons` | ^5.7.0 | ~31 | Feather (`fi`) icons; `components/common/Icon.tsx` resolves names |
| `js-cookie` | ^3.0.8 | auth | token cookies |
| `date-fns` | ^4.4.0 | 5 | date formatting |
| `@vis.gl/react-google-maps` | ^1.9.0 | 1 | Places autocomplete on register |

## Installed but no importer found in `src/`

`@mui/lab`, `@mui/icons-material`, `@mui/x-data-grid`, `@mui/x-date-pickers`, `@react-oauth/google`, `class-variance-authority`, `clsx`, `tailwind-merge`, `dayjs`, `framer-motion`, `jwt-decode`, `next-themes`, `react-loading-skeleton`, `@tanstack/react-query-devtools`. (An older design-standardisation doc noted many unused packages; this remains true.) Tailwind itself is not a dependency; the earlier Tailwind prototype was replaced by MUI.

## Dev dependencies

`@types/js-cookie`, `@types/node` ^20, `@types/react` ^19, `@types/react-dom` ^19, `typescript` ^5, `eslint` ^9, `eslint-config-next`, `babel-plugin-react-compiler`.

## Styling and design system

MUI theme in `src/theme/` (see `COMPONENTS.md`), built by `createAppTheme()` with `cssVariables: { colorSchemeSelector: "class", cssVarPrefix: "mui" }` and both a light and a dark colour scheme. Font: Plus Jakarta Sans (single family) via `next/font/google`. Light mode is the default (`defaultMode="light"`); a dark palette exists but no toggle UI was found. Brand colours (from `src/theme/palette.ts`): deep navy primary `#102B5C`, near-black ink text `#202733`, white page and cards, green/orange/red for success/warning/error, and a **deep medical-green sidebar** (`SIDEBAR_BG` `#075B4C`) with a white active pill. Base corner radius 8px. This differs from the older design doc (navy `#001A4A` sidebar, Bricolage Grotesque headings) - see `KNOWN-LIMITATIONS-AND-DISCREPANCIES.md`.

## External services the browser calls

| Service | When | Config |
|---|---|---|
| IHS backend REST API | always | `NEXT_PUBLIC_API_URL` |
| Google Maps JavaScript API / Places | register page location search | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; blank = plain-text fallback |
| Google Identity | not used in UI | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (defined in the env schema; no component reads it) |
| Google Fonts | build/runtime via `next/font` | none |
