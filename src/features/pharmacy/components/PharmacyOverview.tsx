"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { ROUTES } from "@/constants/routes";
import { OrderStatusChip } from "@/features/pharmacy/components/StatusChips";
import { MOVEMENT_LABEL, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/features/pharmacy/status";
import { useAuth } from "@/hooks/useAuth";
import { pharmacyService } from "@/services/pharmacy.service";
import type { DashboardAnalytics, OrderStatus, PharmacyDashboard, ReportGroupBy } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDateTime, formatDay, formatNumber, todayDay } from "@/utils/format";

/** Chart palette: restrained, one hue family plus status colours only where status is the point. */
const C = {
  navy: "#142F5E",
  blue: "#1769D2",
  light: "#EAF2FF",
  success: "#16A36A",
  warning: "#E99A28",
  danger: "#DC3545",
  muted: "#94A3B8",
  border: "#E1E7F0",
};
const CHART_H = 220;
const SHORT_EXPIRY: Record<string, string> = { expired: "Expired", d30: "≤30d", d60: "31-60d", d90: "61-90d", later: ">90d" };
const NOT_TRACKED_WHY: Record<string, string> = {
  supplierOutstanding: "Supplier payments are not recorded in the system, so what you owe suppliers cannot be calculated.",
  customerCredit: "Credit sales and customer ledgers are not recorded in the system.",
  netProfit: "Operating expenses are not recorded, so net profit cannot be calculated. Gross margin is shown instead.",
};

// ── Period handling ──────────────────────────────────────────────────────────

type Preset = "today" | "7d" | "30d" | "90d" | "180d" | "fy" | "custom";
const PRESETS: Array<{ value: Preset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 3 months" },
  { value: "180d", label: "Last 6 months" },
  { value: "fy", label: "This financial year" },
  { value: "custom", label: "Custom range" },
];

function financialYearStart(): string {
  const t = todayDay();
  const year = Number(t.slice(0, 4));
  return `${Number(t.slice(5, 7)) >= 4 ? year : year - 1}-04-01`;
}

function rangeFor(preset: Preset, from: string, to: string): { from: string; to: string } {
  const today = todayDay();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: todayDay(-6), to: today };
    case "30d":
      return { from: todayDay(-29), to: today };
    case "90d":
      return { from: todayDay(-89), to: today };
    case "180d":
      return { from: todayDay(-179), to: today };
    case "fy":
      return { from: financialYearStart(), to: today };
    default:
      return { from: from || todayDay(-29), to: to || today };
  }
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;
const autoGroup = (days: number): ReportGroupBy => (days <= 31 ? "day" : days <= 120 ? "week" : "month");

function bucketLabel(bucket: string): string {
  if (bucket.length === 7) {
    const [y, m] = bucket.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  }
  const [y, m, d] = bucket.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const compactMoney = (v: number | null) => {
  const n = Number(v || 0);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`;
  return `₹${n}`;
};

// ── Building blocks ──────────────────────────────────────────────────────────

function Panel({ title, subtitle, action, children, minHeight }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; minHeight?: number }) {
  return (
    <Paper elevation={0} sx={{ height: "100%", p: 2, minHeight, bgcolor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 4px 12px rgba(16,24,40,0.04)" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1, gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

const Empty = ({ text, height }: { text: string; height?: number }) => (
  <Stack sx={{ height, minHeight: 60, justifyContent: "center", alignItems: "center", textAlign: "center", px: 1 }}>
    <Typography variant="caption" color="text.secondary">
      {text}
    </Typography>
  </Stack>
);

interface KpiProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  href?: string;
  notTracked?: keyof typeof NOT_TRACKED_WHY;
}
const TONE: Record<NonNullable<KpiProps["tone"]>, string> = { default: C.blue, success: C.success, warning: C.warning, danger: C.danger };

function Kpi({ label, value, hint, tone = "default", href, notTracked }: KpiProps) {
  const unavailable = Boolean(notTracked);
  const body = (
    <Paper
      elevation={0}
      component={href ? Link : "div"}
      {...(href ? { href } : {})}
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 0.4,
        height: "100%",
        minHeight: 88,
        px: 1.75,
        py: 1.5,
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 4px 12px rgba(16,24,40,0.04)",
        textDecoration: "none",
        color: "inherit",
        transition: "box-shadow .15s ease, transform .15s ease, border-color .15s ease",
        ...(href ? { "&:hover": { borderColor: "#D1D5DB", boxShadow: "0 2px 4px rgba(16,24,40,0.06), 0 10px 20px rgba(16,24,40,0.08)", transform: "translateY(-1px)" } } : {}),
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, bgcolor: unavailable ? "#D1D5DB" : TONE[tone] }} />
        <Typography variant="caption" noWrap sx={{ display: "block", lineHeight: 1.2, color: "#6B7280", fontWeight: 500 }}>
          {label}
        </Typography>
      </Stack>
      <Typography noWrap sx={{ fontWeight: 700, lineHeight: 1.3, fontSize: unavailable ? "0.85rem" : "1.3rem", color: unavailable ? "text.disabled" : "#111827" }}>
        {unavailable ? "Not tracked" : value}
      </Typography>
      {hint && !unavailable && (
        <Typography variant="caption" noWrap sx={{ display: "block", lineHeight: 1.2, color: "#9CA3AF" }}>
          {hint}
        </Typography>
      )}
    </Paper>
  );
  return unavailable ? <Tooltip title={NOT_TRACKED_WHY[notTracked!]}>{body}</Tooltip> : body;
}

function KpiGroup({ title, tiles, a, cols }: { title: string; tiles: KpiProps[]; a?: DashboardAnalytics; cols: number }) {
  return (
    <Box>
      <Typography variant="overline" sx={{ display: "block", mb: 0.75, ml: 0.5, lineHeight: 1.5, letterSpacing: 0.8, fontWeight: 700, color: "#6B7280" }}>
        {title}
      </Typography>
      <Grid container spacing={1.5}>
        {tiles.map((t, i) => (
          <Grid key={`${t.label}-${i}`} size={{ xs: 6, sm: 4, lg: 12 / cols }}>
            {a || t.value !== "…" ? <Kpi {...t} /> : <Skeleton variant="rounded" height={88} sx={{ borderRadius: "12px" }} />}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/** Horizontal bar rows — for lists whose labels are too long for a chart axis. */
function BarList({ rows, format }: { rows: Array<{ key: string; label: ReactNode; value: number; right?: ReactNode; color?: string }>; format?: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <Stack spacing={0.9}>
      {rows.map((r) => (
        <Box key={r.key}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
            <Typography variant="caption" noWrap sx={{ fontWeight: 600, minWidth: 0 }}>
              {r.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {r.right ?? (format ? format(r.value) : formatNumber(r.value))}
            </Typography>
          </Stack>
          <Box sx={{ height: 5, borderRadius: 1, bgcolor: C.light, overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${Math.max((r.value / max) * 100, r.value > 0 ? 3 : 0)}%`, bgcolor: r.color ?? C.blue, borderRadius: 1 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function ListRow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Stack component={Link} href={href} direction="row" spacing={1} sx={{ py: 0.7, alignItems: "center", textDecoration: "none", color: "inherit", "&:hover": { bgcolor: "action.hover" } }}>
      {children}
    </Stack>
  );
}

const Divided = ({ children }: { children: ReactNode }) => <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>{children}</Stack>;
const SeeAll = ({ href, label = "View all" }: { href: string; label?: string }) => (
  <Button component={Link} href={href} size="small" sx={{ minWidth: 0, py: 0, fontSize: 12 }}>
    {label}
  </Button>
);

const itemName = (name: string | null, strength?: string | null) => [name ?? "Medicine", strength].filter(Boolean).join(" ");

// ── Dashboard ────────────────────────────────────────────────────────────────

export function PharmacyOverview() {
  const { user } = useAuth();
  const [preset, setPreset] = useState<Preset>("30d");
  const [customFrom, setCustomFrom] = useState(todayDay(-29));
  const [customTo, setCustomTo] = useState(todayDay());
  const [groupOverride, setGroupOverride] = useState<ReportGroupBy | null>(null);

  const range = useMemo(() => rangeFor(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const invalidRange = range.from > range.to || daysBetween(range.from, range.to) > 366;
  const groupBy = groupOverride ?? autoGroup(daysBetween(range.from, range.to));

  const base = useQuery({ queryKey: ["pharmacy-dashboard"], queryFn: pharmacyService.dashboard });
  const analytics = useQuery({
    queryKey: ["pharmacy-dashboard-analytics", range.from, range.to, groupBy],
    queryFn: () => pharmacyService.dashboardAnalytics({ from: range.from, to: range.to, groupBy }),
    enabled: !invalidRange,
    placeholderData: keepPreviousData,
  });

  if (base.isLoading) return <Loading label="Loading your dashboard..." />;
  if (base.error || !base.data) return <ErrorState description={getApiErrorMessage(base.error, "Could not load the dashboard")} onRetry={() => base.refetch()} />;

  const d = base.data;
  const a = analytics.data;
  const c = d.cards;
  const periodLabel = PRESETS.find((p) => p.value === preset)?.label ?? "";

  return (
    <Stack spacing={1.5}>
      {/* Header */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }} noWrap>
            Welcome back, {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Reporting period: {periodLabel}
            {preset === "custom" || preset === "fy" ? ` (${formatDay(range.from)} – ${formatDay(range.to)})` : ""}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
          <TextField select size="small" value={preset} onChange={(e) => { setPreset(e.target.value as Preset); setGroupOverride(null); }} sx={{ minWidth: 170 }} slotProps={{ select: { SelectDisplayProps: { "aria-label": "Reporting period" } } }}>
            {PRESETS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>
          {preset === "custom" && (
            <>
              <TextField size="small" type="date" label="From" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: customTo } }} />
              <TextField size="small" type="date" label="To" value={customTo} onChange={(e) => setCustomTo(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: customFrom, max: todayDay() } }} />
            </>
          )}
          <Button component={Link} href={ROUTES.MEDICINE_NEW} variant="contained" size="small">
            Add medicine
          </Button>
          <Button component={Link} href={ROUTES.PURCHASE_NEW} variant="outlined" size="small">
            Record purchase
          </Button>
          <Button component={Link} href={ROUTES.INVENTORY} variant="outlined" size="small">
            Inventory
          </Button>
          <Tooltip title="Notifications">
            <Chip component={Link} href={ROUTES.NOTIFICATIONS} clickable size="small" color={c.unreadNotifications ? "primary" : "default"} variant={c.unreadNotifications ? "filled" : "outlined"} label={`${formatNumber(c.unreadNotifications)} unread`} />
          </Tooltip>
        </Stack>
      </Stack>

      {invalidRange && <Typography variant="body2" color="error">Choose a start date on or before the end date, within 366 days.</Typography>}

      <KpiGrid d={d} a={a} periodLabel={periodLabel} loading={analytics.isLoading} />

      {analytics.error && !a ? (
        <ErrorState description={getApiErrorMessage(analytics.error, "Could not load the analytics")} onRetry={() => analytics.refetch()} />
      ) : analytics.isLoading || !a ? (
        <Grid container spacing={1.5}>
          {[0, 1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rounded" height={CHART_H + 50} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Analytics a={a} groupBy={groupBy} onGroupBy={setGroupOverride} periodLabel={periodLabel} />
      )}

      <Recent d={d} a={a} />
    </Stack>
  );
}

// ── KPI groups ───────────────────────────────────────────────────────────────

function KpiGrid({ d, a, periodLabel, loading }: { d: PharmacyDashboard; a?: DashboardAnalytics; periodLabel: string; loading: boolean }) {
  const c = d.cards;
  const dash = (v: () => KpiProps): KpiProps => (a ? v() : { label: "", value: "…" });
  const margin = a?.sales.grossMargin;
  const prev = a?.sales.previous;
  const delta = a && prev && prev.net > 0 ? ((a.sales.totals.net - prev.net) / prev.net) * 100 : null;

  const today: KpiProps[] = [
    { label: "Today's sales", value: formatCurrency(c.todaySales), tone: "success", href: ROUTES.ORDERS },
    { label: "Today's orders", value: formatNumber(c.todayOrders), tone: "default", href: ROUTES.ORDERS },
    dash(() => ({ label: "Today's purchases", value: formatCurrency(a!.purchases.today.total), hint: `${a!.purchases.today.purchases} bill(s)` })),
    { label: "Pending orders", value: formatNumber(c.pendingOrders), tone: "warning", href: `${ROUTES.ORDERS}?status=pending` },
    { label: "Pending prescriptions", value: formatNumber(c.pendingPrescriptions), tone: "warning", href: ROUTES.PRESCRIPTIONS },
    dash(() => ({ label: "Payments to confirm", value: formatCurrency(a!.sales.unconfirmedPayments.amount), hint: `${a!.sales.unconfirmedPayments.orders} live order(s)`, tone: "warning" as const, href: ROUTES.ORDERS })),
  ];

  const sales: KpiProps[] = [
    dash(() => ({ label: "This month's sales", value: formatCurrency(a!.sales.thisMonth.net), hint: `${a!.sales.thisMonth.orders} order(s)`, tone: "success" as const })),
    dash(() => ({ label: `Sales · ${periodLabel.toLowerCase()}`, value: formatCurrency(a!.sales.totals.net), hint: delta === null ? "No earlier sales to compare" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}% vs previous period`, tone: "success" as const })),
    dash(() => ({ label: "Avg order value", value: a!.sales.totals.orders ? formatCurrency(a!.sales.totals.averageOrderValue) : "—", hint: `${a!.sales.totals.orders} order(s) in period` })),
    dash(() => ({ label: "Gross margin", value: margin && margin.costedLines > 0 ? formatCurrency(margin.grossMargin) : "No data", hint: margin && margin.marginPercent !== null ? `${margin.marginPercent}% · ${margin.costedLines}/${margin.totalLines} lines costed` : "needs recorded buying prices", tone: "success" as const })),
    dash(() => ({ label: "GST in sales", value: formatCurrency(a!.sales.totals.gst), hint: "output tax, indicative", href: ROUTES.REPORTS })),
    dash(() => ({ label: "Credit notes / refunds", value: formatCurrency(a!.sales.totals.refunds), hint: periodLabel.toLowerCase(), tone: "danger" as const, href: ROUTES.BILLING })),
  ];

  const stock: KpiProps[] = [
    { label: "Total medicines", value: formatNumber(c.totalMedicines), hint: `${formatNumber(c.activeMedicines)} active`, href: ROUTES.MEDICINES },
    { label: "Units in stock", value: formatNumber(c.totalUnits), href: ROUTES.INVENTORY },
    { label: "Low stock", value: formatNumber(c.lowStock), tone: "warning", href: `${ROUTES.INVENTORY}?tab=low` },
    { label: "Out of stock", value: formatNumber(c.outOfStock), tone: "danger", href: `${ROUTES.INVENTORY}?tab=out` },
    { label: `Expiring ≤ ${c.expiryAlertDays} days`, value: formatNumber(c.expiringBatches), hint: `${formatNumber(c.expiringUnits)} units`, tone: "warning", href: `${ROUTES.INVENTORY}?tab=expiring` },
    { label: "Expired batches", value: formatNumber(c.expiredBatches), hint: `${formatNumber(c.expiredUnits)} units`, tone: "danger", href: `${ROUTES.INVENTORY}?tab=expired` },
  ];

  const finance: KpiProps[] = [
    { label: "Stock value · cost", value: formatCurrency(c.stockValueAtCost), hint: c.itemsWithoutCost ? `${c.itemsWithoutCost} item(s) lack a buying price` : undefined },
    { label: "Stock value · selling", value: formatCurrency(c.stockValueAtSale), hint: "incl. GST" },
    dash(() => ({ label: "This month's purchases", value: formatCurrency(a!.purchases.thisMonth.total), hint: `${a!.purchases.thisMonth.purchases} bill(s)` })),
    dash(() => ({ label: `Purchases · ${periodLabel.toLowerCase()}`, value: formatCurrency(a!.purchases.totals.total), hint: `${a!.purchases.totals.purchases} bill(s) · GST ${formatCurrency(a!.purchases.totals.gst)}` })),
    { label: "Supplier outstanding", value: "", notTracked: "supplierOutstanding" },
    { label: "Customer credit", value: "", notTracked: "customerCredit" },
    { label: "Net profit", value: "", notTracked: "netProfit" },
  ];

  return (
    <Stack spacing={2} aria-busy={loading}>
      <KpiGroup title="Today" tiles={today} a={a} cols={6} />
      <KpiGroup title="Sales & revenue" tiles={sales} a={a} cols={6} />
      <KpiGroup title="Stock & expiry" tiles={stock} a={a} cols={6} />
      <KpiGroup title="Purchases & finance" tiles={finance} a={a} cols={4} />
    </Stack>
  );
}

// ── Charts ───────────────────────────────────────────────────────────────────

function Analytics({ a, groupBy, onGroupBy, periodLabel }: { a: DashboardAnalytics; groupBy: ReportGroupBy; onGroupBy: (g: ReportGroupBy) => void; periodLabel: string }) {
  const sales = a.sales;
  const labels = sales.series.map((r) => bucketLabel(r.bucket));
  const hasSales = sales.totals.orders > 0;
  const purchasesByBucket = new Map(a.purchases.series.map((r) => [r.bucket, r.total]));
  const hasPurchases = a.purchases.totals.purchases > 0;

  const methods = sales.byPaymentMethod.filter((m) => m.amount > 0);
  const methodTotal = methods.reduce((s, m) => s + m.amount, 0);
  const methodColors = [C.navy, C.blue, "#7FB0EA"];

  const statusRows = sales.byOrderStatus.filter((s) => s.orders > 0);
  const STATUS_COLOR: Partial<Record<OrderStatus, string>> = { delivered: C.success, pending: C.warning, rejected: C.danger, cancelled: C.muted };

  const expiryColors = [C.danger, C.warning, "#F2C879", "#8FB6EC", C.blue];

  return (
    <Stack spacing={1.5}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel
            title="Sales trend"
            subtitle={`${periodLabel} · net sales incl. GST`}
            action={
              <ToggleButtonGroup size="small" exclusive value={groupBy} onChange={(_, v) => v && onGroupBy(v)} sx={{ "& .MuiToggleButton-root": { py: 0, px: 0.9, fontSize: 11, textTransform: "none" } }}>
                <ToggleButton value="day">Daily</ToggleButton>
                <ToggleButton value="week">Weekly</ToggleButton>
                <ToggleButton value="month">Monthly</ToggleButton>
              </ToggleButtonGroup>
            }
          >
            {!hasSales ? (
              <Empty height={150} text="No sales in this period. Completed patient orders appear here." />
            ) : (
              <LineChart
                height={CHART_H}
                margin={{ left: 8, right: 8, top: 10, bottom: 4 }}
                hideLegend
                xAxis={[{ scaleType: "point", data: labels, tickLabelStyle: { fontSize: 10 } }]}
                yAxis={[{ width: 48, valueFormatter: (v: number) => compactMoney(v), tickLabelStyle: { fontSize: 10 } }]}
                series={[{ data: sales.series.map((r) => r.net), area: true, showMark: labels.length <= 31, color: C.blue, label: "Net sales", valueFormatter: (v) => formatCurrency(v) }]}
              />
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Panel title="Sales by payment method" subtitle={periodLabel}>
            {methods.length === 0 ? (
              <Empty height={150} text="No sales in this period." />
            ) : (
              <Stack sx={{ alignItems: "center" }}>
                <PieChart
                  height={150}
                  width={150}
                  hideLegend
                  margin={0}
                  series={[{ innerRadius: 44, outerRadius: 72, paddingAngle: 2, data: methods.map((m, i) => ({ id: m.paymentMethod, value: m.amount, label: PAYMENT_METHOD_LABEL[m.paymentMethod], color: methodColors[i % methodColors.length] })), valueFormatter: (v) => formatCurrency(v.value) }]}
                />
                <Stack spacing={0.4} sx={{ width: "100%", mt: 0.5 }}>
                  {methods.map((m, i) => (
                    <Stack key={m.paymentMethod} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: methodColors[i % methodColors.length], flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ flex: 1 }} noWrap>
                        {PAYMENT_METHOD_LABEL[m.paymentMethod]}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {formatCurrency(m.amount)} · {((m.amount / methodTotal) * 100).toFixed(0)}%
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Panel title="Sales vs purchases" subtitle="Sales revenue (incl. GST) against purchase cost (bills received)">
            {!hasSales && !hasPurchases ? (
              <Empty height={150} text="No sales or purchases in this period." />
            ) : (
              <BarChart
                height={CHART_H}
                margin={{ left: 8, right: 8, top: 24, bottom: 4 }}
                xAxis={[{ scaleType: "band", data: labels, tickLabelStyle: { fontSize: 10 } }]}
                yAxis={[{ width: 48, valueFormatter: (v: number) => compactMoney(v), tickLabelStyle: { fontSize: 10 } }]}
                series={[
                  { data: sales.series.map((r) => r.net), label: "Sales", color: C.blue, valueFormatter: (v) => formatCurrency(v) },
                  { data: sales.series.map((r) => purchasesByBucket.get(r.bucket) ?? 0), label: "Purchases", color: C.navy, valueFormatter: (v) => formatCurrency(v) },
                ]}
                slotProps={{ legend: { position: { vertical: "top", horizontal: "end" }, sx: { fontSize: 11 } } }}
              />
            )}
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Panel title="Inventory health" subtitle="Active medicines by stock level">
            {a.inventoryHealth.activeMedicines === 0 ? (
              <Empty height={130} text="No active medicines yet." />
            ) : (
              <BarChart
                height={CHART_H - 40}
                margin={{ left: 8, right: 8, top: 10, bottom: 4 }}
                hideLegend
                xAxis={[{ scaleType: "band", data: ["Healthy", "Low", "Out"], colorMap: { type: "ordinal", values: ["Healthy", "Low", "Out"], colors: [C.success, C.warning, C.danger] }, tickLabelStyle: { fontSize: 11 } }]}
                yAxis={[{ width: 32, tickLabelStyle: { fontSize: 10 } }]}
                series={[{ data: [a.inventoryHealth.healthy, a.inventoryHealth.low, a.inventoryHealth.out], valueFormatter: (v) => `${v} medicine(s)` }]}
              />
            )}
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
              Expired batches are never counted as available; quarantine / damaged status is not tracked.
            </Typography>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Panel title="Expiry analysis" subtitle="Units in batches with stock, by time to expiry" action={<SeeAll href={`${ROUTES.INVENTORY}?tab=expiring`} />}>
            {a.expiry.every((e) => e.batches === 0) ? (
              <Empty height={130} text="No batches with stock yet." />
            ) : (
              <BarChart
                height={CHART_H - 40}
                margin={{ left: 8, right: 8, top: 10, bottom: 4 }}
                hideLegend
                xAxis={[{ scaleType: "band", data: a.expiry.map((e) => SHORT_EXPIRY[e.key] ?? e.label), colorMap: { type: "ordinal", values: a.expiry.map((e) => SHORT_EXPIRY[e.key] ?? e.label), colors: expiryColors }, tickLabelStyle: { fontSize: 9 }, tickLabelInterval: () => true }]}
                yAxis={[{ width: 36, tickLabelStyle: { fontSize: 10 } }]}
                series={[{ data: a.expiry.map((e) => e.units), valueFormatter: (v, ctx) => `${v} unit(s) · ${a.expiry[ctx.dataIndex]?.batches ?? 0} batch(es)` }]}
              />
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Panel title="Top-selling medicines" subtitle={`${periodLabel} · by units sold`} action={<SeeAll href={ROUTES.REPORTS} label="Reports" />}>
            {a.topMedicines.length === 0 ? (
              <Empty text="No sales in this period." />
            ) : (
              <BarList
                rows={a.topMedicines.map((m) => ({
                  key: String(m.medicineId),
                  label: itemName(m.medicineName, m.strength),
                  value: m.units,
                  right: `${formatNumber(m.units)} u · ${formatCurrency(m.revenue)}${m.grossMargin !== null ? ` · margin ${formatCurrency(m.grossMargin)}` : ""}`,
                }))}
              />
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Panel title="Orders by status" subtitle={`${periodLabel} · live orders`} action={<SeeAll href={ROUTES.ORDERS} />}>
            {statusRows.length === 0 ? (
              <Empty text="No orders in this period." />
            ) : (
              <BarList rows={statusRows.map((s) => ({ key: s.status, label: ORDER_STATUS_LABEL[s.status], value: s.orders, right: `${s.orders} · ${formatCurrency(s.amount)}`, color: STATUS_COLOR[s.status] }))} />
            )}
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Panel title="Fast-moving" subtitle={`Units sold, last ${a.movers.windowDays} days`}>
            {a.movers.fast.length === 0 ? (
              <Empty text={`Nothing sold in the last ${a.movers.windowDays} days.`} />
            ) : (
              <Divided>
                {a.movers.fast.map((m) => (
                  <ListRow key={m.id} href={ROUTES.MEDICINE_EDIT(m.id)}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }} noWrap>
                        {itemName(m.medicineName, m.strength)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatNumber(m.units)} sold · {formatNumber(m.stock)} left{m.daysOfCover !== null ? (m.daysOfCover > 365 ? " (over a year of cover)" : ` (about ${m.daysOfCover} days of cover)`) : ""}
                      </Typography>
                    </Box>
                    {m.reorderSuggested && <Chip size="small" color="warning" label="Reorder" sx={{ height: 18, fontSize: 10 }} />}
                  </ListRow>
                ))}
              </Divided>
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Panel title="Non-moving stock" subtitle={`In stock, nothing sold in ${a.movers.windowDays} days`}>
            {a.movers.slow.length === 0 ? (
              <Empty text="Every medicine in stock has sold recently." />
            ) : (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  {a.movers.nonMoving.items} item(s) · {formatCurrency(a.movers.nonMoving.valueAtSale)} at selling price
                </Typography>
                <Divided>
                  {a.movers.slow.map((m) => (
                    <ListRow key={m.id} href={ROUTES.MEDICINE_EDIT(m.id)}>
                      <Typography variant="caption" sx={{ flex: 1, fontWeight: 600 }} noWrap>
                        {itemName(m.medicineName, m.strength)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {formatNumber(m.stock)} · {formatCurrency(m.valueAtSale)}
                      </Typography>
                    </ListRow>
                  ))}
                </Divided>
              </>
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Panel title="Supplier analysis" subtitle={`${periodLabel} · purchase value`} action={<SeeAll href={ROUTES.SUPPLIERS} label="Suppliers" />}>
            {a.purchases.bySupplier.length === 0 ? (
              <Empty text="No purchases in this period." />
            ) : (
              <BarList format={formatCurrency} rows={a.purchases.bySupplier.map((s, i) => ({ key: `${s.supplierId ?? "none"}-${i}`, label: s.supplierName, value: s.total, right: `${formatCurrency(s.total)} · ${s.purchases} bill(s)`, color: C.navy }))} />
            )}
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.75 }}>
              Supplier payments and purchase returns are not tracked, so outstanding dues are unavailable.
            </Typography>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <ProfitPanel a={a} periodLabel={periodLabel} />
        </Grid>
      </Grid>
    </Stack>
  );
}

function ProfitPanel({ a, periodLabel }: { a: DashboardAnalytics; periodLabel: string }) {
  const m = a.sales.grossMargin;
  const rows: Array<[string, string]> = [
    ["Revenue excl. GST (costed lines)", formatCurrency(m.revenueExGst)],
    ["Cost of goods sold", formatCurrency(m.cost)],
    ["Gross margin", m.costedLines > 0 ? `${formatCurrency(m.grossMargin)}${m.marginPercent !== null ? ` (${m.marginPercent}%)` : ""}` : "No data"],
  ];
  return (
    <Panel title="Profit & expenses" subtitle={periodLabel}>
      {m.totalLines === 0 ? (
        <Empty text="No sales in this period." />
      ) : (
        <Stack spacing={0.5}>
          {rows.map(([k, v]) => (
            <Stack key={k} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
              <Typography variant="caption" color="text.secondary">{k}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{v}</Typography>
            </Stack>
          ))}
          <Typography variant="caption" color="text.disabled">
            Based on {m.costedLines} of {m.totalLines} sold line(s) that have a recorded buying price.
          </Typography>
        </Stack>
      )}
      <Stack spacing={0.5} sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
        {["Operating expenses", "Net profit"].map((k) => (
          <Stack key={k} direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.secondary">{k}</Typography>
            <Tooltip title={NOT_TRACKED_WHY.netProfit}>
              <Typography variant="caption" color="text.disabled">Not tracked</Typography>
            </Tooltip>
          </Stack>
        ))}
      </Stack>
    </Panel>
  );
}

// ── Alerts + recent activity ─────────────────────────────────────────────────

type Severity = "critical" | "warning" | "info";
const SEV_COLOR: Record<Severity, "error" | "warning" | "info"> = { critical: "error", warning: "warning", info: "info" };

function Recent({ d, a }: { d: PharmacyDashboard; a?: DashboardAnalytics }) {
  const c = d.cards;
  const alerts: Array<{ key: string; severity: Severity; count: number; text: string; href: string }> = [
    { key: "out", severity: "critical" as const, count: c.outOfStock, text: `${c.outOfStock} medicine(s) out of stock`, href: `${ROUTES.INVENTORY}?tab=out` },
    { key: "expired", severity: "critical" as const, count: c.expiredBatches, text: `${c.expiredBatches} expired batch(es) · ${c.expiredUnits} unit(s) to write off`, href: `${ROUTES.INVENTORY}?tab=expired` },
    { key: "low", severity: "warning" as const, count: c.lowStock, text: `${c.lowStock} medicine(s) at or below reorder level`, href: `${ROUTES.INVENTORY}?tab=low` },
    { key: "expiring", severity: "warning" as const, count: c.expiringBatches, text: `${c.expiringBatches} batch(es) expire within ${c.expiryAlertDays} days`, href: `${ROUTES.INVENTORY}?tab=expiring` },
    { key: "rx", severity: "warning" as const, count: c.pendingPrescriptions, text: `${c.pendingPrescriptions} prescription(s) awaiting your action`, href: ROUTES.PRESCRIPTIONS },
    { key: "orders", severity: "info" as const, count: c.pendingOrders, text: `${c.pendingOrders} new order(s) to confirm`, href: `${ROUTES.ORDERS}?status=pending` },
    { key: "pay", severity: "info" as const, count: a?.sales.unconfirmedPayments.orders ?? 0, text: `${a?.sales.unconfirmedPayments.orders ?? 0} order(s) with payment not yet confirmed (${formatCurrency(a?.sales.unconfirmedPayments.amount)})`, href: ROUTES.ORDERS },
    { key: "notif", severity: "info" as const, count: c.unreadNotifications, text: `${c.unreadNotifications} unread notification(s)`, href: ROUTES.NOTIFICATIONS },
  ].filter((x) => x.count > 0);

  return (
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <Panel title="Alert centre" subtitle="Thresholds come from your reorder levels and expiry window (Settings)">
          {alerts.length === 0 ? (
            <Empty text="All clear — nothing needs attention." />
          ) : (
            <Divided>
              {alerts.map((al) => (
                <ListRow key={al.key} href={al.href}>
                  <Chip size="small" color={SEV_COLOR[al.severity]} label={al.severity} sx={{ height: 18, fontSize: 10, textTransform: "capitalize", minWidth: 58 }} />
                  <Typography variant="caption" sx={{ flex: 1 }}>
                    {al.text}
                  </Typography>
                </ListRow>
              ))}
            </Divided>
          )}
        </Panel>
      </Grid>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <Panel title="Recent orders" subtitle="Patient orders are this pharmacy's sales" action={<SeeAll href={ROUTES.ORDERS} />}>
          {d.recentOrders.length === 0 ? (
            <Empty text="No orders yet." />
          ) : (
            <Divided>
              {d.recentOrders.map((o) => (
                <ListRow key={o.id} href={ROUTES.ORDER_DETAIL(o.id)}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }} noWrap>
                      {o.orderNumber} · {o.patient?.name ?? "Patient"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                      {formatDateTime(o.placedAt || o.createdAt)} · {PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>{formatCurrency(o.totalAmount)}</Typography>
                    <OrderStatusChip status={o.status} />
                  </Box>
                </ListRow>
              ))}
            </Divided>
          )}
        </Panel>
      </Grid>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <Panel title="Recent purchases" action={<SeeAll href={ROUTES.PURCHASES} />}>
          {d.recentPurchases.length === 0 ? (
            <Empty text="No purchases recorded yet." />
          ) : (
            <Divided>
              {d.recentPurchases.map((p) => (
                <ListRow key={p.id} href={ROUTES.PURCHASE_DETAIL(p.id)}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }} noWrap>
                      {p.supplier?.name ?? "No supplier"} · Inv {p.invoiceNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                      {p.purchaseNumber} · {formatDay(p.invoiceDate)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatCurrency(p.totalAmount)}</Typography>
                </ListRow>
              ))}
            </Divided>
          )}
        </Panel>
      </Grid>
      <Grid size={{ xs: 12, md: 6, xl: 3 }}>
        <Panel title="Recent stock movements" action={<SeeAll href={ROUTES.INVENTORY} />}>
          {!a ? (
            <Skeleton variant="rounded" height={120} />
          ) : a.recentStockMovements.length === 0 ? (
            <Empty text="No stock movements yet." />
          ) : (
            <Divided>
              {a.recentStockMovements.slice(0, 6).map((m) => (
                <ListRow key={m.id} href={ROUTES.MEDICINE_EDIT(m.inventoryId)}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }} noWrap>
                      {itemName(m.medicineName, m.strength)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                      {MOVEMENT_LABEL[m.movementType] ?? m.movementType}
                      {m.batchNumber ? ` · batch ${m.batchNumber}` : ""} · {formatDateTime(m.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: m.quantity < 0 ? C.danger : C.success }}>
                    {m.quantity > 0 ? "+" : ""}
                    {m.quantity}
                  </Typography>
                </ListRow>
              ))}
            </Divided>
          )}
        </Panel>
      </Grid>
    </Grid>
  );
}
