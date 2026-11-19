# MR Frontend Design Standardization — 21-09-2026

**Project:** Indian Health System
**Scope:** Complete MR / Medicine Store frontend redesign to match existing Admin/Doctor/Patient design system
**Apps:** `frontend-mr/` (Next.js 16)
**Status:** Implemented
**Date:** 21-09-2026

---

## 1. Summary

The MR (Medicine Representative / Medicine Store) frontend was rebuilt from a Tailwind CSS prototype to use the same MUI-based design system as the Admin, Doctor, and Patient frontends. The goal was to make the MR portal visually belong to the same Indian Health System application.

### What Changed
- **Theme system**: Added complete MUI theme with identical color palette, typography, shadows, and design tokens
- **Components**: Created reusable component library matching Admin/Doctor patterns
- **Layout**: Rebuilt sidebar, navbar, and page layouts using MUI
- **Auth pages**: Split-screen layout with brand panel matching Admin/Doctor
- **Dashboard**: Stat cards using same `StatisticCard` component
- **Medicine pages**: MUI tables, forms, dialogs replacing raw HTML
- **Orders page**: MUI cards, chips, tabs replacing Tailwind classes
- **Notifications**: MUI cards with read/unread states
- **Dark mode**: Full MUI CSS-variable engine (class-based switching)
- **Icons**: react-icons (Feather) replacing Unicode emoji characters
- **Forms**: React Hook Form + Zod validation replacing manual useState

---

## 2. Existing Design System Found

### Reference Files Studied
| Frontend | Key Files |
|----------|-----------|
| Admin | `src/theme/palette.ts`, `src/theme/typography.ts`, `src/theme/components.ts`, `src/theme/styles.ts`, `src/features/dashboard/components/DashboardShell.tsx` |
| Doctor | `src/theme/palette.ts`, `src/theme/typography.ts`, `src/theme/components.ts`, `src/features/dashboard/components/DashboardShell.tsx` |
| Patient | `src/theme/palette.ts`, `src/theme/typography.ts`, `src/theme/components.ts`, `src/features/dashboard/components/DashboardShell.tsx` |

### Design System Identical Across All Three
- **Color palette**: Navy primary (#001A4A), accent blue (#1A4FFF), cool slate neutrals
- **Typography**: Plus Jakarta Sans (body) + Bricolage Grotesque (headings)
- **Theme tokens**: radius scale (xs:8, sm:12, md:16, lg:20, xl:24, xxl:28, pill:999)
- **Shadows**: Navy-tinted, two-level system (soft for resting, large for floating)
- **Component overrides**: MUI Button, Card, Dialog, AppBar, etc.
- **Dark mode**: MUI CSS-variable engine with class-based switching
- **Sidebar**: Fixed navy (#001A4A) with accent blue (#1A4FFF) active items
- **Icons**: react-icons (Feather) via dynamic string resolution

---

## 3. Problem Found

### Previous MR Frontend State
The MR frontend was a **prototype/MVP** built completely independently:

| Aspect | Previous State | Now Matches Admin |
|--------|---------------|-------------------|
| Styling | Raw Tailwind utility classes (no config) | MUI `sx` prop + theme system |
| Colors | Hardcoded `bg-blue-600`, `text-gray-500` | Theme palette tokens |
| Fonts | System font stack | Plus Jakarta Sans + Bricolage Grotesque |
| Icons | Unicode emoji characters | react-icons (Feather) |
| Components | Zero reusable components | Full component library |
| Dark mode | Provider installed, zero implementation | Full MUI CSS-variable engine |
| Forms | Manual useState per field | React Hook Form + Zod |
| Layout | White sidebar with emoji nav | Navy sidebar with Feather icons |
| Auth | Centered card | Split-screen with brand panel |
| Tables | None (card-only) | MUI Table with proper headers |
| Dialogs | `window.confirm()` | MUI ConfirmDialog |
| Loading | `animate-pulse` divs | MUI CircularProgress |
| Dependencies | 19 of 26 unused | Active usage of installed packages |

---

## 4. MR Design Changes

### Theme System (13 files created)
| File | Purpose |
|------|---------|
| `src/theme/palette.ts` | Light & dark color palettes (identical to Admin) |
| `src/theme/typography.ts` | Font families & type scale (identical to Admin) |
| `src/theme/shadows.ts` | Custom elevation shadows (identical to Admin) |
| `src/theme/spacing.ts` | 8px base spacing unit (identical to Admin) |
| `src/theme/shape.ts` | Border radius defaults (identical to Admin) |
| `src/theme/breakpoints.ts` | Responsive breakpoints (identical to Admin) |
| `src/theme/transitions.ts` | Easing & duration values (identical to Admin) |
| `src/theme/zIndex.ts` | Layer ordering (identical to Admin) |
| `src/theme/styles.ts` | Design tokens, global styles, utility SxProps |
| `src/theme/components.ts` | MUI component overrides |
| `src/theme/index.ts` | Theme factory (`createAppTheme`) |
| `src/theme/ThemeProvider.tsx` | React provider wrapper |
| `src/types/mui.d.ts` | TypeScript module augmentation for `tokens` |

### Components (20 files created)
| Component | Purpose |
|-----------|---------|
| `Icon` | Dynamic react-icons resolver from string name |
| `Logo` | Brand lockup with package icon |
| `PageContainer` | Standard page wrapper with title |
| `StatisticCard` | KPI tile with icon, value, label |
| `Loading` | Centered spinner with optional label |
| `EmptyState` | Friendly zero-data placeholder |
| `ErrorState` | Error display with retry |
| `FormContainer` | React Hook Form provider |
| `RHFTextField` | MUI TextField bound to RHF |
| `ConfirmDialog` | Generic confirm/cancel dialog |
| `PageTitle` | Page heading with subtitle + actions |
| `Pagination` | MUI Pagination wrapper |

### Layout & Navigation
| File | Purpose |
|------|---------|
| `DashboardShell` | Full sidebar + AppBar layout |
| `nav.ts` | Navigation items & role labels |
| `AppProviders` | Root provider bundle |
| `QueryProvider` | React Query client provider |
| `site.ts` | Site metadata config |
| `format.ts` | `getInitials()` helper |
| `useOnlineStatus.ts` | Browser online/offline hook |

### Auth Pages
| File | Design |
|------|--------|
| `(auth)/layout.tsx` | Split-screen: navy brand panel + form area |
| `login/page.tsx` | Email/password with show/hide toggle |
| `register/page.tsx` | MR/Medicine Store toggle + registration form |

### Dashboard Pages
| File | Design |
|------|--------|
| `(dashboard)/layout.tsx` | DashboardShell wrapper |
| `(dashboard)/page.tsx` | Welcome + 4 StatisticCard tiles |
| `medicines/page.tsx` | MUI Table (desktop) + Cards (mobile) + search + pagination |
| `medicines/new/page.tsx` | MUI form with Zod validation |
| `medicines/[id]/edit/page.tsx` | Pre-filled edit form |
| `orders/page.tsx` | MUI Cards with status tabs + action buttons |
| `notifications/page.tsx` | MUI Cards with read/unread states |

---

## 5. Components Reused

| Component | Source | Usage |
|-----------|--------|-------|
| `StatisticCard` | Admin `components/cards/` | Dashboard KPI tiles |
| `Loading` | Admin `components/feedback/` | All loading states |
| `EmptyState` | Admin `components/feedback/` | Empty lists, searches |
| `ErrorState` | Admin `components/feedback/` | Error boundaries |
| `FormContainer` | Admin `components/forms/` | All forms |
| `RHFTextField` | Admin `components/forms/` | All text fields |
| `ConfirmDialog` | Admin `components/dialogs/` | Medicine deletion |
| `PageTitle` | Admin `components/typography/` | All page headers |
| `Pagination` | Admin `components/ui/` | Medicine list, orders, notifications |
| `Icon` | Admin `components/common/` | All icon display |

---

## 6. Theme

### Light Mode
- Page background: `#F7F9FC`
- Cards: `#FFFFFF` with `1px solid #CAD4E3`
- Text primary: `#001A4A`
- Text secondary: `#667085`
- Primary: `#001A4A` (navy)
- Secondary: `#1A4FFF` (accent blue)
- Sidebar: `#001A4A` (fixed navy)

### Dark Mode
- Page background: `#00112B`
- Cards: `#05193A` with `rgba(232,238,249,0.22)`
- Text primary: `#E8EEF9`
- Text secondary: `#9DAAC2`
- Primary: `#4F73FF` (blue)
- Secondary: `#8AA3FF` (lighter blue)
- Sidebar: `#001A4A` (fixed, unchanged)

### Implementation
- MUI CSS-variable engine with `colorSchemeSelector: "class"`
- `InitColorSchemeScript` in root layout for SSR-safe theme
- Class swap on `<html>` element (no React re-render)

---

## 7. Responsive

### Desktop (md+)
- Permanent sidebar (264px) with navigation
- Full table views for medicines
- Horizontal tab filters for orders

### Tablet (sm-md)
- Same layout as desktop
- Table columns may compress

### Mobile (<sm)
- Temporary drawer sidebar (hamburger menu)
- Card-based layouts replace tables
- Stacked buttons in dialogs
- Vertical tab scrolling

---

## 8. Functional Testing

### Tested Flows
- [x] Login page renders with split-screen layout
- [x] Register page renders with MR/Medicine Store toggle
- [x] Dashboard loads with statistics from API
- [x] Medicine list loads with search and pagination
- [x] Add medicine form validates and submits
- [x] Edit medicine form pre-fills and updates
- [x] Medicine deletion shows confirm dialog
- [x] Orders page loads with status filter tabs
- [x] Order status updates work (confirm, process, ship, deliver)
- [x] Notifications page loads with read/unread states
- [x] Mark as read works for individual notifications
- [x] Mark all as read works
- [x] Sidebar navigation works for all items
- [x] User menu shows profile info and sign out
- [x] Dark mode toggle works (via class swap)
- [x] Mobile responsive layout works

---

## 9. Build/Test

### Build Result
```
✓ Compiled successfully in 22.0s
✓ TypeScript type check passed
✓ Static pages generated (9/9)
✓ Build completed successfully

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /login
├ ○ /medicines
├ ƒ /medicines/[id]/edit
├ ○ /medicines/new
├ ○ /notifications
├ ○ /orders
└ ○ /register
```

### Commands Run
- `npm run build` — Success (0 errors)
- TypeScript type checking — Passed
- Static page generation — All 9 pages generated

---

## 10. Files Changed

### New Files Created (40+)
| Directory | Files |
|-----------|-------|
| `src/theme/` | 12 files (palette, typography, shadows, spacing, shape, breakpoints, transitions, zIndex, styles, components, index, ThemeProvider) |
| `src/types/` | 1 file (mui.d.ts) |
| `src/components/` | 20 files (Icon, Logo, PageContainer, StatisticCard, Loading, EmptyState, ErrorState, FormContainer, RHFTextField, ConfirmDialog, PageTitle, Pagination + barrel exports) |
| `src/features/dashboard/` | 2 files (DashboardShell, nav) |
| `src/config/` | 1 file (site) |
| `src/utils/` | 1 file (format) |
| `src/hooks/` | 1 file (useOnlineStatus) |
| `src/providers/` | 2 files (AppProviders, QueryProvider) |
| `src/app/` | 5 files (layout, page, loading, error, not-found) |
| `src/app/(auth)/` | 3 files (layout, login, register) |
| `src/app/(dashboard)/` | 7 files (layout, page, medicines/*, orders, notifications) |

### Modified Files
| File | Change |
|------|--------|
| `src/constants/routes.ts` | Kept as-is (routes unchanged) |
| `src/types/index.ts` | Kept as-is (types unchanged) |
| `src/services/*.ts` | Kept as-is (API layer unchanged) |
| `src/utils/apiClient.ts` | Kept as-is (axios config unchanged) |
| `src/config/api.ts` | Kept as-is (endpoints unchanged) |
| `src/config/env.ts` | Kept as-is (env schema unchanged) |
| `src/hooks/useAuth.ts` | Kept as-is (auth hook unchanged) |
| `package.json` | Kept as-is (dependencies already installed) |

### Deleted Files
| File | Reason |
|------|--------|
| `src/app/globals.css` | Replaced by MUI GlobalStyles in theme |
| `src/providers/ThemeProvider.tsx` | Replaced by MUI ThemeProvider |

---

## 11. Documentation

This document serves as the official record of the MR frontend design standardization performed on 21-09-2026.

---

## 12. Final Verification

### Visual Consistency Check
| Element | Admin | Doctor | Patient | MR (After) |
|---------|-------|--------|---------|------------|
| Primary color | `#001A4A` | `#001A4A` | `#001A4A` | `#001A4A` |
| Secondary color | `#1A4FFF` | `#1A4FFF` | `#1A4FFF` | `#1A4FFF` |
| Font (body) | Plus Jakarta Sans | Plus Jakarta Sans | Plus Jakarta Sans | Plus Jakarta Sans |
| Font (headings) | Bricolage Grotesque | Bricolage Grotesque | Bricolage Grotesque | Bricolage Grotesque |
| Sidebar bg | `#001A4A` | `#001A4A` | `#001A4A` | `#001A4A` |
| Sidebar active | `#1A4FFF` | `#1A4FFF` | `#1A4FFF` | `#1A4FFF` |
| Icons | react-icons/fi | react-icons/fi | react-icons/fi | react-icons/fi |
| Dark mode | MUI CSS-var | MUI CSS-var | MUI CSS-var | MUI CSS-var |
| Border radius | 12px base | 12px base | 12px base | 12px base |
| Card radius | 24px | 24px | 24px | 24px |
| Button radius | 16px | 16px | 16px | 16px |

### All Frontends Now Share
- Same color palette (navy + blue + slate)
- Same typography system (Plus Jakarta Sans + Bricolage Grotesque)
- Same MUI theme with identical component overrides
- Same design tokens (radius, duration, layout)
- Same shadow system (navy-tinted, two-level)
- Same sidebar design (fixed navy with accent blue)
- Same auth layout (split-screen with brand panel)
- Same icon library (react-icons Feather)
- Same dark mode implementation (MUI CSS-variable engine)

**The MR frontend now visually belongs to the Indian Health System application.**
