/**
 * Extracts initials from a full name for avatar display.
 * Strips common prefixes like "Dr." and uses first letter of first + last name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** `5000` / `"5000.00"` → `₹5,000`. Empty / non-numeric → `—`. */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? inrFormatter.format(n) : "—";
}

/** An ISO instant → "15 Oct 2026, 4:05 pm". Empty → `—`. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** `1250` → `1,250` (Indian grouping). */
export function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value);
  return value === null || value === undefined || value === "" || !Number.isFinite(n) ? "—" : n.toLocaleString("en-IN");
}

/** Today in the browser's calendar as "YYYY-MM-DD" (the pharmacy's local day). */
export function todayDay(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A plain "YYYY-MM-DD" day → "15 Oct 2026" (parsed as a LOCAL date, no timezone shift). */
export function formatDay(day: string | null | undefined): string {
  if (!day) return "—";
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(date.getTime())
    ? day
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
