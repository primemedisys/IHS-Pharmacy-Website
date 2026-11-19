"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { DayRangeFilter, initialDayRange, type DayRange } from "@/components/forms/DayRangeFilter";
import { PageTitle } from "@/components/typography/PageTitle";
import { KpiTile } from "@/features/pharmacy/components/KpiTile";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/features/pharmacy/status";
import { pharmacyService } from "@/services/pharmacy.service";
import type { ReportGroupBy } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDay, formatNumber } from "@/utils/format";
import { filterRowSx } from "@/features/pharmacy/components/filterRow";

type TabKey = "sales" | "top" | "purchases" | "gst" | "stock";

const money = (v: number) => formatCurrency(v);

function SimpleTable({ head, rows, minWidth = 560 }: { head: string[]; rows: ReactNode[][]; minWidth?: number }) {
  return (
    <Card variant="outlined">
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 56 }}>#</TableCell>
              {head.map((h, i) => (
                <TableCell key={h} align={i === 0 ? "left" : "right"}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length ? (
              rows.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell>{i + 1}</TableCell>
                  {r.map((c, j) => (
                    <TableCell key={j} align={j === 0 ? "left" : "right"}>
                      {c}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={head.length + 1}>
                  <Typography variant="body2" color="text.secondary">
                    No data in this period.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

const bucketLabel = (b: string, g: ReportGroupBy) => (g === "month" ? b : g === "week" ? `Week of ${formatDay(b)}` : formatDay(b));

function useReport<T>(key: string, fn: () => Promise<T>, deps: unknown[]) {
  return useQuery({ queryKey: ["report", key, ...deps], queryFn: fn, placeholderData: keepPreviousData });
}

function Section({ q, children }: { q: { isLoading: boolean; error: unknown; refetch: () => unknown }; children: ReactNode }) {
  if (q.isLoading) return <Loading label="Building report..." />;
  if (q.error) return <ErrorState description={getApiErrorMessage(q.error, "Could not build the report")} onRetry={() => q.refetch()} />;
  return <>{children}</>;
}

function Sales({ range, groupBy }: { range: DayRange; groupBy: ReportGroupBy }) {
  const q = useReport("sales", () => pharmacyService.salesReport({ ...range, groupBy }), [range, groupBy]);
  const d = q.data;
  return (
    <Section q={q}>
      {d && (
        <Stack spacing={2}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiShoppingCart" label="Orders" value={formatNumber(d.totals.orders)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiTrendingUp" label="Net sales (incl. GST)" value={money(d.totals.net)} color="success" hint={`Avg order ${money(d.totals.averageOrderValue)}`} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiPercent" label="GST in sales" value={money(d.totals.gst)} color="info" hint={`Discounts ${money(d.totals.discount)}`} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiCornerUpLeft" label="Refunds (credit notes)" value={money(d.totals.refunds)} color="warning" hint={`Net after refunds ${money(d.totals.netAfterRefunds)}`} /></Grid>
          </Grid>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Gross margin: {money(d.grossMargin.grossMargin)}
                {d.grossMargin.marginPercent !== null ? ` (${d.grossMargin.marginPercent}%)` : ""}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sales excl. GST {money(d.grossMargin.revenueExGst)} − buying cost {money(d.grossMargin.cost)}, over {d.grossMargin.costedLines} of {d.grossMargin.totalLines} sold line(s) that have a buying price.{" "}
                {d.grossMargin.note}
              </Typography>
            </CardContent>
          </Card>
          <SimpleTable
            head={[groupBy === "day" ? "Day" : groupBy === "week" ? "Week" : "Month", "Orders", "Gross", "Discount", "Net sales", "Taxable", "GST", "Refunds"]}
            rows={d.series.map((r) => [bucketLabel(r.bucket, groupBy), r.orders, money(r.gross), money(r.discount), money(r.net), money(r.taxable), money(r.gst), money(r.refunds)])}
            minWidth={820}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <SimpleTable head={["Order status", "Orders", "Amount"]} rows={d.byOrderStatus.map((r) => [ORDER_STATUS_LABEL[r.status] ?? r.status, r.orders, money(r.amount)])} minWidth={300} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SimpleTable head={["Payment status", "Orders", "Amount"]} rows={d.byPaymentStatus.map((r) => [PAYMENT_STATUS_LABEL[r.paymentStatus] ?? r.paymentStatus, r.orders, money(r.amount)])} minWidth={300} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SimpleTable head={["Payment method", "Orders", "Amount"]} rows={d.byPaymentMethod.map((r) => [PAYMENT_METHOD_LABEL[r.paymentMethod] ?? r.paymentMethod, r.orders, money(r.amount)])} minWidth={300} />
            </Grid>
          </Grid>
        </Stack>
      )}
    </Section>
  );
}

function Top({ range }: { range: DayRange }) {
  const q = useReport("top", () => pharmacyService.topMedicines({ ...range, limit: 20 }), [range]);
  return (
    <Section q={q}>
      {q.data && (
        <SimpleTable
          head={["Medicine", "Units sold", "Orders", "Revenue", "Gross margin"]}
          rows={q.data.medicines.map((m) => [[m.medicineName, m.strength].filter(Boolean).join(" "), m.units, m.orders, money(m.revenue), m.grossMargin === null ? "—" : money(m.grossMargin)])}
        />
      )}
    </Section>
  );
}

function Purchases({ range, groupBy }: { range: DayRange; groupBy: ReportGroupBy }) {
  const q = useReport("purchases", () => pharmacyService.purchaseReport({ ...range, groupBy }), [range, groupBy]);
  const d = q.data;
  return (
    <Section q={q}>
      {d && (
        <Stack spacing={2}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiTruck" label="Purchases" value={formatNumber(d.totals.purchases)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiDollarSign" label="Total spent" value={money(d.totals.total)} color="warning" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiPercent" label="Input GST" value={money(d.totals.gst)} color="info" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiTag" label="Trade discounts" value={money(d.totals.discount)} color="success" /></Grid>
          </Grid>
          <SimpleTable
            head={[groupBy === "day" ? "Day" : groupBy === "week" ? "Week" : "Month", "Purchases", "Gross", "Discount", "Taxable", "GST", "Total"]}
            rows={d.series.map((r) => [bucketLabel(r.bucket, groupBy), r.purchases, money(r.gross), money(r.discount), money(r.taxable), money(r.gst), money(r.total)])}
            minWidth={720}
          />
          <SimpleTable head={["Supplier", "Purchases", "Total"]} rows={d.bySupplier.map((s) => [s.supplierName, s.purchases, money(s.total)])} minWidth={360} />
        </Stack>
      )}
    </Section>
  );
}

function Gst({ range }: { range: DayRange }) {
  const q = useReport("gst", () => pharmacyService.gstReport(range), [range]);
  const d = q.data;
  const rows = (list: Array<{ gstRate: number; taxable: number; gst: number }>) => list.map((r) => [`${r.gstRate}%`, money(r.taxable), money(r.gst)]);
  return (
    <Section q={q}>
      {d && (
        <Stack spacing={2}>
          <Alert severity="info">{d.note}</Alert>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiArrowUpRight" label="Output GST (sales)" value={money(d.totals.outputGst)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiCornerUpLeft" label="Reversed (credit notes)" value={money(d.totals.returnGst)} color="warning" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiArrowDownLeft" label="Input GST (purchases)" value={money(d.totals.inputGst)} color="info" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiPercent" label="Net (indicative)" value={money(d.totals.netGst)} color="success" /></Grid>
          </Grid>
          {d.linesWithoutGstData.lines > 0 && (
            <Alert severity="warning">
              {d.linesWithoutGstData.lines} sold line(s) worth {money(d.linesWithoutGstData.amount)} were placed before GST details were recorded and are not included.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Sales (output)</Typography>
              <SimpleTable head={["Rate", "Taxable", "GST"]} rows={rows(d.output)} minWidth={300} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Credit notes</Typography>
              <SimpleTable head={["Rate", "Taxable", "GST"]} rows={rows(d.returns)} minWidth={300} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Purchases (input)</Typography>
              <SimpleTable head={["Rate", "Taxable", "GST"]} rows={rows(d.input)} minWidth={300} />
            </Grid>
          </Grid>
        </Stack>
      )}
    </Section>
  );
}

function StockSummary() {
  const q = useReport("stock", () => pharmacyService.stockReport(), []);
  const d = q.data;
  return (
    <Section q={q}>
      {d && (
        <Stack spacing={2}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiPackage" label="Active medicines" value={formatNumber(d.summary.activeMedicines)} hint={`${formatNumber(d.summary.totalUnits)} units`} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiDollarSign" label="Stock value at cost" value={money(d.summary.stockValueAtCost)} hint={d.summary.itemsWithoutCost ? `${d.summary.itemsWithoutCost} item(s) without buying price` : undefined} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiTag" label="Stock value at selling price" value={money(d.summary.stockValueAtSale)} color="success" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiAlertTriangle" label="Low / out of stock" value={`${d.summary.lowStock} / ${d.summary.outOfStock}`} color="warning" hint={`${d.summary.expiredBatches} expired batch(es)`} /></Grid>
          </Grid>
          <SimpleTable
            head={["Category", "Medicines", "Units", "Low", "Out", "Value at cost", "Value at sale"]}
            rows={d.byCategory.map((c) => [c.category, c.medicines, formatNumber(c.units), c.lowStock, c.outOfStock, money(c.valueAtCost), money(c.valueAtSale)])}
            minWidth={720}
          />
        </Stack>
      )}
    </Section>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<TabKey>("sales");
  const [range, setRange] = useState<DayRange>(initialDayRange("30d"));
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("day");
  const dated = tab !== "stock";

  return (
    <Stack spacing={3}>
      <PageTitle title="Reports" subtitle="Aggregated from your real orders, purchases, credit notes and stock" />
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab value="sales" label="Sales" sx={{ textTransform: "none" }} />
          <Tab value="top" label="Top medicines" sx={{ textTransform: "none" }} />
          <Tab value="purchases" label="Purchases" sx={{ textTransform: "none" }} />
          <Tab value="gst" label="GST" sx={{ textTransform: "none" }} />
          <Tab value="stock" label="Stock" sx={{ textTransform: "none" }} />
        </Tabs>
      </Box>
      {dated && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap sx={filterRowSx}>
          <DayRangeFilter initial="30d" allowAll={false} label="Period" onChange={setRange} />
          {(tab === "sales" || tab === "purchases") && (
            <TextField size="small" select label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value as ReportGroupBy)} sx={{ minWidth: 140 }}>
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
            </TextField>
          )}
        </Stack>
      )}
      {tab === "sales" && <Sales range={range} groupBy={groupBy} />}
      {tab === "top" && <Top range={range} />}
      {tab === "purchases" && <Purchases range={range} groupBy={groupBy} />}
      {tab === "gst" && <Gst range={range} />}
      {tab === "stock" && <StockSummary />}
      <Typography variant="caption" color="text.secondary">
        A report covers at most 366 days. Sales count orders that are real to you (COD, or paid online) and not cancelled or rejected.
      </Typography>
    </Stack>
  );
}
