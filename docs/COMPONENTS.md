# Components and Theme

Imports use the `@/` alias (`src/`). Barrel files (`index.ts`) exist in each `components/*` folder and `components/index.ts` re-exports common, ui, forms, feedback, dialogs, cards and typography (not `maps`). The component set was copied from the other IHS portals so all share a design system (see `docs-shared/` design-system notes; this app's older doc `frontend-mr/docs/feature-history/mr-frontend-design-standardization-21-09-2026` records that migration).

## Shared components (`src/components/`)

| Component | Props (verified) | Notes |
|---|---|---|
| `PageTitle` | `title`, `subtitle?`, `actions?`, `sx?` | Header used on every page |
| `PageContainer` | `title?`, `subtitle?`, `actions?`, `maxWidth?`, `children`, `sx?` | Wrapper with optional title |
| `StatisticCard` | `icon`, `value`, `label`, `color?` (primary/secondary/success/info/warning), `sx?` | Tinted tile using `CARD_TONES`; used by legacy stats page and `LabOverview` |
| `Icon` | name string | Resolves react-icons Feather names; icon accent colours come from `AccentTile` |
| `AccentTile` | icon name, accent key | Semantic colour mapping (navy, green, red, orange, purple, teal, amber, grey) |
| `Logo` | - | Brand lockup in the sidebar and auth panel |
| `Loading` | `label?`, `fullScreen?`, `size?`, `sx?` | Spinner; full screen = 100dvh |
| `EmptyState` | `icon?` (default FiInbox), `title`, `description?`, `action?`, `sx?` | |
| `ErrorState` | `title?`, `description?`, `onRetry?`, `sx?` | |
| `ConfirmDialog` | `open`, `title`, `description?`, `confirmLabel?`, `cancelLabel?`, `tone?` (primary/error/warning), `loading?`, `onConfirm`, `onClose` | |
| `Pagination` | `count`, `page`, `onChange(page)`, `sx?` | Renders nothing for <= 1 page |
| `FormContainer` | `methods` (RHF), `onSubmit`, `children`, `sx?` | `FormProvider` + form element |
| `RHFTextField` | `name` plus TextField props | RHF-bound, shows validation message |
| `DayRangeFilter` | `onChange({from,to})`, `initial?`, `allowAll?`, `label?` | IST day strings; presets and custom; used by dashboards/reports/orders |
| `DateRangeFilter` | `onChange` | ISO datetime range with presets all/today/7d/30d/custom (a second, older filter; importers not re-checked) |
| `ProviderLocationAutocomplete` | `value`, `onChange`, `label`, `error`, `helperText` (see Inner props) | `dynamic(..., { ssr: false })` wrapper; Inner uses `APIProvider`/`useMapsLibrary` and falls back to a plain text input when `env.isMapsEnabled` is false |

## Feature components

| Feature | Component | Purpose |
|---|---|---|
| dashboard | `DashboardShell` | App bar, permanent/temporary sidebar (264 px), role guard, avatar menu |
| pharmacy | `PharmacyOverview` | Dashboard with KPI grid, `@mui/x-charts` panels, alert centre, recent lists |
| pharmacy | `KpiTile` | `icon`, `label`, `value`, `hint?`, `color?`, `href?` |
| pharmacy | `StatusChips` | `StockChip`, `ExpiryChip`, `OrderStatusChip`, `PaymentChip` (labels/colours from `status.ts`) |
| pharmacy | `CommercialFields` | Shared commercial inputs + `commercialShape`, `refineCommercial`, `toCommercialPayload` helpers for zod/RHF; loads active suppliers |
| pharmacy | `InvoiceView` (+ `PrintOnly`, `StoreBlock`, `GstSummaryTable`) | Tax invoice layout, printed through the browser |
| pharmacy | `SupplierDialog` | Create/edit supplier |
| pharmacy | `PaymentQrCard` | UPI id, payee, QR upload/remove/active |
| pharmacy | `UpiQrPayment` (`MarkPaymentReceivedButton`) | Payment-received confirmation for UPI QR orders |
| pharmacy | `filterRow.ts` | `filterRowSx` layout helper for filter rows |
| medicines | `ImageSlots` | Image grid: add, remove, promote |
| medicines | `MedicineMediaSection` | Loads/saves global images + substitutes for a master |
| medicines | `SubstitutePicker` | Autocomplete to choose substitute medicines (max count, excludes self) |
| diagnostics | `LabOverview` | Lab KPI tiles + recent requests |
| diagnostics | `AnswerEditor` | Per-test availability, price and reason entry |
| diagnostics | `ReportsCard` | Upload reports for tests; view as blob |

## Status maps (`features/*/status.ts`)

* Pharmacy: `ORDER_STATUS_LABEL/COLOR`, `ORDER_NEXT_STATUS`, `PAYMENT_STATUS_*`, `PAYMENT_METHOD_LABEL`, `STOCK_STATUS_*`, `EXPIRY_STATUS_*`, `MOVEMENT_LABEL`, `MEDICINE_TYPES`, `titleCase`.
* Diagnostics: `DIAGNOSTIC_STATUSES`, `diagnosticStatusLabel/Color`, `REPORT_FILE_TYPES`, `ANSWERABLE_STATUSES`, `REJECTABLE_STATUSES`, `REPORT_STATUSES`.

## Theme (`src/theme/`)

Files: `index.ts` (`createAppTheme`), `ThemeProvider.tsx` (`AppThemeProvider`: MUI ThemeProvider with `defaultMode="light"`, `CssBaseline enableColorScheme`, `GlobalStyles`), `palette.ts`, `typography.ts`, `shape.ts` (base radius 8), `shadows.ts`, `spacing.ts`, `breakpoints.ts`, `transitions.ts`, `zIndex.ts`, `components.ts` (MUI overrides; the theme makes TextField `fullWidth`, which is why `filterRowSx` exists), `styles.ts` (design tokens and global CSS-in-JS: no `.css` files). `src/types/mui.d.ts` augments the theme with `tokens`.

| Token group | Values (verified) |
|---|---|
| radius (`theme.tokens.radius`) | xs 6, sm 8, md 10, lg 12, xl 14, xxl 16, pill 999 |
| layout | navbar 64, content max width 1440, container padding 24 |
| palette primary | `#102B5C` (dark mode `#8FB0DA`) |
| sidebar | `SIDEBAR_BG` `#075B4C`, active pill white with green text |
| card tones | `CARD_TONES` green, red, orange, purple, teal, gray, blue (full-card pastels) |
| accents | `semanticAccents` navy, green, red, orange, purple, teal, amber, grey |

Rules recorded in the source comments: components must use theme palette/tokens rather than raw hex values; `overflow-x: clip` on `body` is a safety net and wide tables need their own scroll wrapper.

## Responsiveness

Breakpoint `md` switches the sidebar between a temporary drawer and a permanent one; list pages render cards on small screens; the filter helper stacks fields full width below `md`.

## Accessibility notes found in code

`aria-label` on menu/account/edit icon buttons, `role="status"` on `Loading`, `aria-hidden` spacer toolbar, show/hide password button labels. No automated a11y testing exists.
