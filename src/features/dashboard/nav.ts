import { ROUTES } from "@/constants/routes";
import type { UserRole } from "@/types";

export interface DashNavItem {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
  /** Sidebar group heading; consecutive items with the same section share one heading. */
  section?: string;
}

/** The single place that decides "is this account a Diagnostic Lab Center?". */
export function isDiagnosticLab(role: UserRole | null | undefined): boolean {
  return role === "diagnostic_lab";
}

/** Pharmacy-only sections a Diagnostic Lab Center has no access to. */
const PHARMACY_ONLY_ROUTES: string[] = [
  ROUTES.MEDICINES,
  ROUTES.CATEGORIES,
  ROUTES.INVENTORY,
  ROUTES.PURCHASES,
  ROUTES.SUPPLIERS,
  ROUTES.ORDERS,
  ROUTES.PRESCRIPTIONS,
  ROUTES.BILLING,
  ROUTES.REPORTS,
  ROUTES.SETTINGS,
];
/** Lab-only sections a pharmacy has no access to. */
const LAB_ONLY_ROUTES: string[] = [ROUTES.DIAGNOSTICS];

const underRoute = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/**
 * UX-only route guard (the backend enforces access with 403s): false when the
 * signed-in role should not be on `pathname`, so the shell can send it to
 * the overview instead.
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const blocked = isDiagnosticLab(role) ? PHARMACY_ONLY_ROUTES : LAB_ONLY_ROUTES;
  return !blocked.some((base) => underRoute(pathname, base));
}

export function dashboardNavForRole(role: UserRole): DashNavItem[] {
  if (isDiagnosticLab(role)) {
    return [
      { label: "Overview", href: ROUTES.DASHBOARD, icon: "FiGrid" },
      { label: "Diagnostic Requests", href: ROUTES.DIAGNOSTICS, icon: "FiClipboard" },
      { label: "Tests", href: ROUTES.DIAGNOSTIC_TESTS, icon: "FiActivity" },
      { label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: "FiBell" },
    ];
  }
  return [
    { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "FiGrid" },
    { section: "Medicines", label: "All Medicines", href: ROUTES.MEDICINES, icon: "FiPackage" },
    { section: "Medicines", label: "Add Medicine", href: ROUTES.MEDICINE_NEW, icon: "FiPlusSquare" },
    { section: "Medicines", label: "Bulk Import", href: ROUTES.MEDICINE_IMPORT, icon: "FiUploadCloud" },
    // { section: "Medicines", label: "Categories", href: ROUTES.CATEGORIES, icon: "FiTag" },
    { section: "Inventory", label: "Stock & Expiry", href: ROUTES.INVENTORY, icon: "FiLayers" },
    { section: "Purchases", label: "Purchases", href: ROUTES.PURCHASES, icon: "FiTruck" },
    { section: "Purchases", label: "Suppliers", href: ROUTES.SUPPLIERS, icon: "FiBriefcase" },
    { section: "Orders", label: "Patient Orders", href: ROUTES.ORDERS, icon: "FiShoppingCart" },
    { section: "Orders", label: "Prescription Orders", href: ROUTES.PRESCRIPTIONS, icon: "FiFileText" },
    { section: "Billing", label: "Invoices & Payments", href: ROUTES.BILLING, icon: "FiCreditCard" },
    { section: "Insights", label: "Reports", href: ROUTES.REPORTS, icon: "FiBarChart2" },
    { section: "Account", label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: "FiBell" },
    { section: "Account", label: "Settings", href: ROUTES.SETTINGS, icon: "FiSettings" },
  ];
}

export const roleLabel: Record<UserRole, string> = {
  medicine_store: "Pharmacy Medicine Store / Clinic",
  pharmacy_hospital: "Pharmacy Hospital",
  diagnostic_lab: "Diagnostic Lab Center",
  // Retired provider type — existing accounts only.
  mr: "Medicine Representative",
  patient: "Patient",
  doctor: "Doctor",
  admin: "Administrator",
  clinic: "Clinic",
};
