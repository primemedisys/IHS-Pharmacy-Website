"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { FiSearch } from "react-icons/fi";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { DayRangeFilter, type DayRange } from "@/components/forms/DayRangeFilter";
import { PageTitle } from "@/components/typography/PageTitle";
import { Pagination } from "@/components/ui/Pagination";
import { ROUTES } from "@/constants/routes";
import { OrderStatusChip, PaymentChip } from "@/features/pharmacy/components/StatusChips";
import { PAYMENT_METHOD_LABEL } from "@/features/pharmacy/status";
import { orderService } from "@/services/order.service";
import { pharmacyService } from "@/services/pharmacy.service";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { filterRowSx } from "@/features/pharmacy/components/filterRow";

function Filters({ children, onSearch, search, onRange }: { children?: ReactNode; search: string; onSearch: (v: string) => void; onRange: (r: DayRange) => void }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} useFlexGap sx={filterRowSx}>
      <TextField
        size="small"
        placeholder="Search…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        slotProps={{ input: { startAdornment: <FiSearch style={{ marginRight: 8, opacity: 0.5 }} /> } }}
        sx={{ minWidth: { md: 260 } }}
      />
      {children}
      <DayRangeFilter onChange={onRange} />
    </Stack>
  );
}

function Invoices() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [range, setRange] = useState<DayRange>({});
  const [page, setPage] = useState(1);
  const params = { search: search.trim() || undefined, paymentStatus: paymentStatus || undefined, ...range, page, limit: 15 };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["order-groups", "billing", params], queryFn: () => orderService.listGroups(params), placeholderData: keepPreviousData });
  return (
    <Stack spacing={2}>
      <Filters search={search} onSearch={(v) => { setSearch(v); setPage(1); }} onRange={(r) => { setRange(r); setPage(1); }}>
        <TextField size="small" select label="Payment" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Unpaid</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
          <MenuItem value="refunded">Refunded</MenuItem>
        </TextField>
      </Filters>
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState description={getApiErrorMessage(error, "Could not load invoices")} onRetry={() => refetch()} />
      ) : !data.orders.length ? (
        <EmptyState icon="FiFileText" title="No invoices" description="Every patient order has a bill — they appear here." />
      ) : (
        <>
          <Card variant="outlined">
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">GST incl.</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Order</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.orders.map((o, idx) => (
                    <TableRow key={o.id} hover sx={{ cursor: "pointer" }} onClick={() => router.push(ROUTES.ORDER_DETAIL(o.id))}>
                      <TableCell>{(page - 1) * 15 + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{o.orderNumber}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(o.placedAt || o.createdAt)}</TableCell>
                      <TableCell>{o.patient?.name ?? "—"}</TableCell>
                      <TableCell align="right">{formatCurrency(o.discountTotal)}</TableCell>
                      <TableCell align="right">{o.taxableTotal === null ? "—" : formatCurrency(o.gstTotal)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(o.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                          <PaymentChip status={o.paymentStatus} />
                          <Typography variant="caption" color="text.secondary">
                            {o.paymentMethod === "upi_qr" ? "UPI QR" : o.paymentMethod.toUpperCase()}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <OrderStatusChip status={o.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          <Pagination count={data.totalPages} page={page} onChange={setPage} />
        </>
      )}
    </Stack>
  );
}

function Payments() {
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [range, setRange] = useState<DayRange>({});
  const [page, setPage] = useState(1);
  const params = { status: status || undefined, method: method || undefined, ...range, page, limit: 15 };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["payments", params], queryFn: () => pharmacyService.listPayments(params), placeholderData: keepPreviousData });
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} useFlexGap sx={filterRowSx}>
        <TextField size="small" select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="success">Success</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
        </TextField>
        <TextField size="small" select label="Method" value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="cod">Cash on Delivery</MenuItem>
          <MenuItem value="online">Online</MenuItem>
          <MenuItem value="upi_qr">UPI QR</MenuItem>
        </TextField>
        <DayRangeFilter onChange={(r) => { setRange(r); setPage(1); }} />
      </Stack>
      <Typography variant="caption" color="text.secondary">
        COD is marked paid when the order is delivered. Online payments are simulated on this platform — no money is transferred. UPI QR payments go
        straight to your UPI account — mark each one received on its order after checking your UPI app.
      </Typography>
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState description={getApiErrorMessage(error, "Could not load payments")} onRetry={() => refetch()} />
      ) : !data.payments.length ? (
        <EmptyState icon="FiCreditCard" title="No payments" />
      ) : (
        <>
          <Card variant="outlined">
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>When</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.payments.map((p, idx) => (
                    <TableRow key={p.id}>
                      <TableCell>{(page - 1) * 15 + idx + 1}</TableCell>
                      <TableCell>
                        <Link href={ROUTES.ORDER_DETAIL(p.orderGroupId)}>{p.orderNumber}</Link>
                      </TableCell>
                      <TableCell>{p.patientName ?? "—"}</TableCell>
                      <TableCell>{PAYMENT_METHOD_LABEL[p.method]}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={p.status} color={p.status === "success" ? "success" : p.status === "failed" ? "error" : "warning"} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {p.reference ?? (p.payerReference ? `Patient reported ${p.payerReference}` : null) ?? p.failureReason ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(p.paidAt || p.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          <Pagination count={data.totalPages} page={page} onChange={setPage} />
        </>
      )}
    </Stack>
  );
}

function CreditNotes() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DayRange>({});
  const [page, setPage] = useState(1);
  const params = { search: search.trim() || undefined, ...range, page, limit: 15 };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["returns", params], queryFn: () => pharmacyService.listReturns(params), placeholderData: keepPreviousData });
  return (
    <Stack spacing={2}>
      <Filters search={search} onSearch={(v) => { setSearch(v); setPage(1); }} onRange={(r) => { setRange(r); setPage(1); }} />
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState description={getApiErrorMessage(error, "Could not load credit notes")} onRetry={() => refetch()} />
      ) : !data.returns.length ? (
        <EmptyState icon="FiCornerUpLeft" title="No returns" description="Record a return from a delivered order's page — a credit note is created here." />
      ) : (
        <>
          <Card variant="outlined">
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell>Credit note</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell align="right">Units</TableCell>
                    <TableCell align="right">GST</TableCell>
                    <TableCell align="right">Refund</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.returns.map((r, idx) => (
                    <TableRow key={r.id} hover sx={{ cursor: "pointer" }} onClick={() => router.push(ROUTES.CREDIT_NOTE(r.id))}>
                      <TableCell>{(page - 1) * 15 + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.creditNoteNumber}</TableCell>
                      <TableCell>{r.orderNumber}</TableCell>
                      <TableCell>{r.patient?.name ?? "—"}</TableCell>
                      <TableCell align="right">{r.itemCount}</TableCell>
                      <TableCell align="right">{formatCurrency(r.gstTotal)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(r.refundAmount)}
                      </TableCell>
                      <TableCell>{r.restocked ? "Restocked" : "Not restocked"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(r.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          <Pagination count={data.totalPages} page={page} onChange={setPage} />
        </>
      )}
    </Stack>
  );
}

export default function BillingPage() {
  const [tab, setTab] = useState<"invoices" | "payments" | "returns">("invoices");
  return (
    <Stack spacing={3}>
      <PageTitle title="Invoices & payments" subtitle="Bills of patient orders, payment records and credit notes" />
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab value="invoices" label="Invoices" sx={{ textTransform: "none" }} />
          <Tab value="payments" label="Payments" sx={{ textTransform: "none" }} />
          <Tab value="returns" label="Returns / credit notes" sx={{ textTransform: "none" }} />
        </Tabs>
      </Box>
      {tab === "invoices" && <Invoices />}
      {tab === "payments" && <Payments />}
      {tab === "returns" && <CreditNotes />}
    </Stack>
  );
}
