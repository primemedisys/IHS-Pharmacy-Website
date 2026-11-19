# Folder Structure

Verified against the working tree (excluding `node_modules/`, `.next/`, `tsconfig.tsbuildinfo`).

```text
frontend-mr/
├── .env.example                 # documented env template (placeholders only)
├── .gitignore
├── eslint.config.mjs            # eslint-config-next core-web-vitals + typescript
├── next.config.ts               # reactCompiler: true, output: "standalone"
├── package.json                 # scripts: dev(3004), build, start(3004), lint
├── package-lock.json
├── tsconfig.json                # strict, path alias "@/*" -> "./src/*"
└── src/
    ├── app/
    │   ├── layout.tsx           # fonts, metadata, color-scheme script, AppProviders
    │   ├── page.tsx             # redirect("/login")
    │   ├── loading.tsx, error.tsx, not-found.tsx
    │   ├── dashboard/           # /dashboard (layout = DashboardShell; page = Lab/Pharmacy overview)
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── (auth)/
    │   │   ├── layout.tsx       # split-screen brand panel
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   └── (dashboard)/
    │       ├── layout.tsx       # DashboardShell
    │       ├── page.tsx         # legacy 4-tile stats page (maps to "/")
    │       ├── billing/page.tsx
    │       ├── billing/returns/[id]/page.tsx     # credit note
    │       ├── categories/page.tsx, categories/new/page.tsx
    │       ├── diagnostics/page.tsx, diagnostics/[id]/page.tsx, diagnostics/tests/page.tsx
    │       ├── inventory/page.tsx
    │       ├── medicines/page.tsx, medicines/new/page.tsx, medicines/import/page.tsx,
    │       │   medicines/[id]/edit/page.tsx
    │       ├── notifications/page.tsx
    │       ├── orders/page.tsx, orders/[id]/page.tsx
    │       ├── prescriptions/page.tsx, prescriptions/[id]/page.tsx
    │       ├── purchases/page.tsx, purchases/new/page.tsx, purchases/[id]/page.tsx
    │       ├── reports/page.tsx
    │       ├── settings/page.tsx
    │       └── suppliers/page.tsx
    ├── components/
    │   ├── cards/StatisticCard.tsx
    │   ├── common/AccentTile.tsx, Icon.tsx, Logo.tsx, PageContainer.tsx
    │   ├── dialogs/ConfirmDialog.tsx
    │   ├── feedback/EmptyState.tsx, ErrorState.tsx, Loading.tsx
    │   ├── forms/DateRangeFilter.tsx, DayRangeFilter.tsx, FormContainer.tsx, RHFTextField.tsx
    │   ├── maps/ProviderLocationAutocomplete.tsx, ProviderLocationAutocompleteInner.tsx
    │   ├── typography/PageTitle.tsx
    │   ├── ui/Pagination.tsx
    │   └── index.ts (+ index.ts barrels per folder)
    ├── config/
    │   ├── api.ts               # API_BASE_URL + API_ENDPOINTS registry
    │   ├── env.ts               # zod-validated NEXT_PUBLIC_* env
    │   └── site.ts              # name, short name, description, url
    ├── constants/routes.ts      # ROUTES map
    ├── features/
    │   ├── dashboard/           # nav.ts (role-aware nav + guard), components/DashboardShell.tsx
    │   ├── diagnostics/         # status.ts; components/AnswerEditor, LabOverview, ReportsCard
    │   ├── medicines/components/ImageSlots, MedicineMediaSection, SubstitutePicker
    │   └── pharmacy/            # status.ts; components/CommercialFields, InvoiceView, KpiTile,
    │                            #   PaymentQrCard, PharmacyOverview, StatusChips, SupplierDialog,
    │                            #   UpiQrPayment, filterRow.ts
    ├── hooks/useAuth.ts, useOnlineStatus.ts
    ├── providers/AppProviders.tsx, AuthProvider.tsx, QueryProvider.tsx
    ├── services/auth, diagnostic, medicine, notification, order, pharmacy, prescription (.service.ts)
    ├── theme/                   # ThemeProvider, index, palette, typography, shape, shadows,
    │                            #   spacing, breakpoints, transitions, zIndex, components, styles
    ├── types/index.ts, mui.d.ts
    └── utils/apiClient.ts, apiError.ts, format.ts
```

Notes:

* `src/app/dashboard/` (literal folder) and `src/app/(dashboard)/` (route group) coexist. The group contributes every business page; the literal folder provides `/dashboard`.
* `src/hooks/useOnlineStatus.ts` exists but no importer was found (grep for `useOnlineStatus` only matched its own file).
* `ROUTES.PROFILE` ("/profile") is defined but there is no `profile` page.
* There is no `public/` folder in the tracked tree; `siteConfig.ogImage` points to `/og.png`, which therefore does not exist in this folder (Unclear whether it is supplied elsewhere).
* `AccentTile.tsx`, `PaymentQrCard.tsx`, `PharmacyOverview.tsx` and `UpiQrPayment.tsx` were **untracked** in git at the time of writing (new, not yet committed), although other tracked files import them.
* No `middleware.ts`/`proxy.ts`, no `Dockerfile`, no test directory.
