"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { DayRangeFilter, type DayRange } from "@/components/forms/DayRangeFilter";
import { PageTitle } from "@/components/typography/PageTitle";
import { Pagination } from "@/components/ui/Pagination";
import { ROUTES } from "@/constants/routes";
import { OrderStatusChip, PaymentChip } from "@/features/pharmacy/components/StatusChips";
import { MarkPaymentReceivedButton, UpiPaymentNote } from "@/features/pharmacy/components/UpiQrPayment";
import { ORDER_NEXT_STATUS, ORDER_STATUSES, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/features/pharmacy/status";
import { orderService } from "@/services/order.service";
import type { OrderGroup, OrderStatus } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { filterRowSx } from "@/features/pharmacy/components/filterRow";

const isStatus = (v: string | null): v is OrderStatus => !!v && (ORDER_STATUSES as string[]).includes(v);

function OrderCard({ order, onStatus, onPaid, busy }: { order: OrderGroup; onStatus: (o: OrderGroup, s: OrderStatus) => void; onPaid: () => Promise<unknown>; busy: boolean }) {
  const next = ORDER_NEXT_STATUS[order.status] ?? [];
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography component={Link} href={ROUTES.ORDER_DETAIL(order.id)} variant="subtitle1" sx={{ fontWeight: 700, color: "inherit" }}>
                {order.orderNumber}
              </Typography>
              <OrderStatusChip status={order.status} />
              <PaymentChip status={order.paymentStatus} />
              {order.prescriptionRequestId && <Chip size="small" variant="outlined" color="secondary" label={`Rx #${order.prescriptionRequestId}`} />}
              {order.refundedTotal > 0 && <Chip size="small" variant="outlined" label={`Refunded ${formatCurrency(order.refundedTotal)}`} />}
            </Stack>
            <Typography variant="body2">
              <b>{order.patient?.name ?? "Patient"}</b>
              {order.patient?.phone ? ` · ${order.patient.phone}` : ""} · {formatDateTime(order.placedAt || order.createdAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.items.map((i) => `${[i.medicineName, i.strength].filter(Boolean).join(" ")} × ${i.quantity}`).join(", ")}
            </Typography>
            {order.deliveryAddress && (
              <Typography variant="caption" color="text.secondary">
                Deliver to: {[order.deliveryAddress, order.deliveryCity, order.deliveryPincode].filter(Boolean).join(", ")}
              </Typography>
            )}
          </Stack>
          <Stack spacing={1} sx={{ alignItems: { md: "flex-end" }, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatCurrency(order.totalAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {PAYMENT_METHOD_LABEL[order.paymentMethod]}
              {order.discountTotal > 0 ? ` · disc. ${formatCurrency(order.discountTotal)}` : ""}
              {order.taxableTotal !== null ? ` · GST ${formatCurrency(order.gstTotal)}` : ""}
            </Typography>
            <UpiPaymentNote order={order} />
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: { md: "flex-end" } }}>
              {next.map((s) => (
                <Button
                  key={s}
                  size="small"
                  variant={s === "rejected" ? "outlined" : "contained"}
                  color={s === "rejected" ? "error" : "primary"}
                  disabled={busy}
                  onClick={() => onStatus(order, s)}
                  sx={{ textTransform: "none" }}
                >
                  {ORDER_STATUS_LABEL[s]}
                </Button>
              ))}
              <MarkPaymentReceivedButton order={order} onDone={onPaid} />
              <Button size="small" component={Link} href={ROUTES.ORDER_DETAIL(order.id)} sx={{ textTransform: "none" }}>
                Details &amp; bill
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function OrdersContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initial = searchParams.get("status");
  const [status, setStatus] = useState<OrderStatus | "">(isStatus(initial) ? initial : "");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DayRange>({});
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const params = {
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
    paymentMethod: paymentMethod || undefined,
    search: search.trim() || undefined,
    ...range,
    page,
    limit: 10,
  };
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["order-groups", params],
    queryFn: () => orderService.listGroups(params),
    placeholderData: keepPreviousData,
  });

  const onPaid = () => Promise.all(["order-groups", "order-group", "invoice", "payments", "pharmacy-dashboard"].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));

  const onStatus = async (order: OrderGroup, next: OrderStatus) => {
    setUpdatingId(order.id);
    try {
      await orderService.updateGroupStatus(order.id, next);
      toast.success(`${order.orderNumber} marked ${ORDER_STATUS_LABEL[next]}`);
      await Promise.all(["order-groups", "pharmacy-dashboard", "my-medicines"].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update order"));
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs: Array<{ value: OrderStatus | ""; label: string }> = [{ value: "", label: "All" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))];

  return (
    <Stack spacing={3}>
      <PageTitle title="Patient orders" subtitle="Orders placed by patients — confirm, prepare, deliver and bill" />
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={status} onChange={(_, v) => { setStatus(v); setPage(1); }} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 40 }}>
          {tabs.map((t) => (
            <Tab key={t.value || "all"} value={t.value} label={t.label} sx={{ minHeight: 40, textTransform: "none" }} />
          ))}
        </Tabs>
      </Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} useFlexGap sx={filterRowSx}>
        <TextField
          size="small"
          placeholder="Order number or patient name"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          slotProps={{ input: { startAdornment: <FiSearch style={{ marginRight: 8, opacity: 0.5 }} /> } }}
          sx={{ minWidth: { md: 280 } }}
        />
        <TextField size="small" select label="Payment" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Unpaid</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
          <MenuItem value="refunded">Refunded</MenuItem>
        </TextField>
        <TextField size="small" select label="Method" value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="cod">Cash on Delivery</MenuItem>
          <MenuItem value="online">Online</MenuItem>
          <MenuItem value="upi_qr">UPI QR</MenuItem>
        </TextField>
        <DayRangeFilter label="Order date" onChange={(r) => { setRange(r); setPage(1); }} />
      </Stack>

      {isLoading ? (
        <Loading label="Loading orders..." />
      ) : error || !data ? (
        <ErrorState description={getApiErrorMessage(error, "Could not load orders")} onRetry={() => refetch()} />
      ) : data.orders.length === 0 ? (
        <EmptyState icon="FiShoppingCart" title="No orders found" description={status || search ? "Try another filter." : "Orders appear here when patients place them."} />
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            {data.total} order(s){isFetching ? " · updating…" : ""} · unpaid online orders appear once paid
          </Typography>
          <Stack spacing={1.5}>
            {data.orders.map((o) => (
              <OrderCard key={o.id} order={o} onStatus={onStatus} onPaid={onPaid} busy={updatingId === o.id} />
            ))}
          </Stack>
          <Pagination count={data.totalPages} page={page} onChange={setPage} />
        </>
      )}
    </Stack>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrdersContent />
    </Suspense>
  );
}
