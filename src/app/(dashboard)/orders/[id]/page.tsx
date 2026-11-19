"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FiCornerUpLeft, FiPrinter } from "react-icons/fi";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { InvoiceView, PrintOnly } from "@/features/pharmacy/components/InvoiceView";
import { OrderStatusChip, PaymentChip } from "@/features/pharmacy/components/StatusChips";
import { canConfirmUpiPayment, MarkPaymentReceivedButton, UpiPaymentNote } from "@/features/pharmacy/components/UpiQrPayment";
import { ORDER_NEXT_STATUS, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/features/pharmacy/status";
import { orderService } from "@/services/order.service";
import { pharmacyService } from "@/services/pharmacy.service";
import type { OrderGroup, OrderStatus } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDateTime, formatDay } from "@/utils/format";

function ReturnDialog({ order, onClose, onDone }: { order: OrderGroup; onClose: () => void; onDone: () => Promise<void> }) {
  const [qty, setQty] = useState<Record<number, string>>({});
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [saving, setSaving] = useState(false);

  const items = order.items
    .map((i) => ({ orderLineId: i.id, quantity: Number(qty[i.id] || 0), max: i.quantity - i.returnedQuantity }))
    .filter((i) => i.quantity > 0);
  const invalid = items.some((i) => !Number.isInteger(i.quantity) || i.quantity > i.max);

  const submit = async () => {
    setSaving(true);
    try {
      const note = await pharmacyService.createReturn(order.id, { items: items.map(({ orderLineId, quantity }) => ({ orderLineId, quantity })), reason: reason || undefined, restock });
      toast.success(`Credit note ${note.creditNoteNumber} — refund ${formatCurrency(note.refundAmount)}`);
      await onDone();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not record the return"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record a return</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            The refund is the returned share of what each line was actually charged (after discount, GST included) — computed by the server.
          </Typography>
          {order.items.map((i) => {
            const max = i.quantity - i.returnedQuantity;
            return (
              <Stack key={i.id} direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {[i.medicineName, i.strength].filter(Boolean).join(" ")}{" "}
                  <Typography component="span" variant="caption" color="text.secondary">
                    (sold {i.quantity}, returned {i.returnedQuantity})
                  </Typography>
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  label="Return qty"
                  value={qty[i.id] ?? ""}
                  disabled={max <= 0}
                  onChange={(e) => setQty((q) => ({ ...q, [i.id]: e.target.value }))}
                  error={Number(qty[i.id] || 0) > max}
                  helperText={max <= 0 ? "Fully returned" : `max ${max}`}
                  sx={{ width: 130 }}
                />
              </Stack>
            );
          })}
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. wrong medicine, damaged pack" />
          <FormControlLabel control={<Switch checked={restock} onChange={(e) => setRestock(e.target.checked)} />} label="Put units back on the shelf (sealed and in date)" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} loading={saving} disabled={!items.length || invalid}>
          Create credit note
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function OrderDetailPage() {
  const id = useParams().id as string;
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);
  const [returning, setReturning] = useState(false);
  const { data: order, isLoading, error, refetch } = useQuery({ queryKey: ["order-group", id], queryFn: () => orderService.getGroup(id) });
  const { data: invoice } = useQuery({ queryKey: ["invoice", id], queryFn: () => orderService.getInvoice(id), enabled: !!order });

  const refresh = () =>
    Promise.all(["order-group", "invoice", "order-groups", "payments", "pharmacy-dashboard", "my-medicines"].map((k) => queryClient.invalidateQueries({ queryKey: [k] }))).then(() => undefined);

  if (isLoading) return <Loading label="Loading order..." />;
  if (error || !order) return <ErrorState description={getApiErrorMessage(error, "Order not found")} onRetry={() => refetch()} />;

  const setStatus = async (next: OrderStatus) => {
    setUpdating(true);
    try {
      await orderService.updateGroupStatus(order.id, next);
      toast.success(`Order marked ${ORDER_STATUS_LABEL[next]}`);
      await refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update order"));
    } finally {
      setUpdating(false);
    }
  };

  const next = ORDER_NEXT_STATUS[order.status] ?? [];
  const canReturn = order.status === "delivered" && order.items.some((i) => i.quantity > i.returnedQuantity);
  const costed = order.items.filter((i) => i.unitCost !== null && i.unitCost !== undefined && i.taxableAmount !== null);
  const margin = costed.reduce((sum, i) => sum + (i.taxableAmount ?? 0) - (i.unitCost ?? 0) * i.quantity, 0);

  return (
    <Stack spacing={3}>
      <PrintOnly />
      <PageTitle
        title={`Order ${order.orderNumber}`}
        subtitle={`Placed ${formatDateTime(order.placedAt || order.createdAt)}`}
        actions={
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }} className="no-print">
            {next.map((s) => (
              <Button key={s} variant={s === "rejected" ? "outlined" : "contained"} color={s === "rejected" ? "error" : "primary"} disabled={updating} onClick={() => setStatus(s)}>
                {ORDER_STATUS_LABEL[s]}
              </Button>
            ))}
            {canReturn && (
              <Button variant="outlined" startIcon={<FiCornerUpLeft />} onClick={() => setReturning(true)}>
                Record return
              </Button>
            )}
            <Button component={Link} href={ROUTES.ORDERS}>
              Back
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2} className="no-print">
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Status
              </Typography>
              <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                <OrderStatusChip status={order.status} size="medium" />
                <PaymentChip status={order.paymentStatus} size="medium" />
              </Stack>
              <Typography variant="body2">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</Typography>
              <UpiPaymentNote order={order} />
              {canConfirmUpiPayment(order) && (
                <Stack direction="row" sx={{ mt: 1 }}>
                  <MarkPaymentReceivedButton order={order} onDone={refresh} />
                </Stack>
              )}
              {order.prescriptionRequestId && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  From prescription <Link href={ROUTES.PRESCRIPTION_DETAIL(order.prescriptionRequestId)}>#{order.prescriptionRequestId}</Link>
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {order.patient?.name ?? "—"}
              </Typography>
              {order.patient?.phone && <Typography variant="body2">{order.patient.phone}</Typography>}
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Delivery
              </Typography>
              <Typography variant="body2">{[order.deliveryAddress, order.deliveryCity, order.deliveryState, order.deliveryPincode].filter(Boolean).join(", ") || "—"}</Typography>
              {order.notes && (
                <Typography variant="caption" color="text.secondary">
                  Note: {order.notes}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatCurrency(order.totalAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Subtotal {formatCurrency(order.subtotal)} · discount {formatCurrency(order.discountTotal)}
                {order.taxableTotal !== null ? ` · GST incl. ${formatCurrency(order.gstTotal)}` : ""}
              </Typography>
              {costed.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Gross margin (excl. GST): <b>{formatCurrency(margin)}</b>
                  {costed.length < order.items.length ? ` (${costed.length}/${order.items.length} lines with a buying price)` : ""}
                </Typography>
              )}
              {order.refundedTotal > 0 && (
                <Typography variant="body2" color="error.main">
                  Refunded {formatCurrency(order.refundedTotal)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined" className="no-print">
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 56 }}>#</TableCell>
                <TableCell>Medicine</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Discount</TableCell>
                <TableCell align="right">GST</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Cost / unit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items.map((i, idx) => (
                <TableRow key={i.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {[i.medicineName, i.strength].filter(Boolean).join(" ")}
                    </Typography>
                    {i.returnedQuantity > 0 && (
                      <Typography variant="caption" color="error.main">
                        {i.returnedQuantity} returned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{i.batchNumber ? `${i.batchNumber}${i.expiryDate ? ` · ${formatDay(i.expiryDate)}` : ""}` : "—"}</TableCell>
                  <TableCell align="right">{i.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(i.unitPrice)}</TableCell>
                  <TableCell align="right">{i.discountAmount ? `${formatCurrency(i.discountAmount)} (${i.discountPercent}%)` : "—"}</TableCell>
                  <TableCell align="right">{i.taxableAmount === null ? "—" : `${formatCurrency(i.gstAmount)} (${i.gstRate}%)`}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatCurrency(i.lineTotal)}
                  </TableCell>
                  <TableCell align="right">{i.unitCost === null || i.unitCost === undefined ? "—" : formatCurrency(i.unitCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {order.returns.length > 0 && (
        <Card variant="outlined" className="no-print">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Credit notes
            </Typography>
            {order.returns.map((r) => (
              <Typography key={r.id} variant="body2">
                <Link href={ROUTES.CREDIT_NOTE(r.id)}>{r.creditNoteNumber}</Link> · {formatDateTime(r.createdAt)} · {formatCurrency(r.refundAmount)}{" "}
                {r.restocked ? "· restocked" : "· not restocked"}
              </Typography>
            ))}
          </CardContent>
        </Card>
      )}

      <Stack spacing={1.5}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }} className="no-print">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Tax invoice
          </Typography>
          <Button variant="outlined" startIcon={<FiPrinter />} onClick={() => window.print()} disabled={!invoice}>
            Print / save PDF
          </Button>
        </Stack>
        {order.status === "cancelled" || order.status === "rejected" ? (
          <Alert severity="info" className="no-print">This order was {order.status}; the bill is shown for reference only.</Alert>
        ) : null}
        {invoice ? <InvoiceView invoice={invoice} /> : <Loading size={24} label="Loading invoice..." />}
      </Stack>

      {returning && <ReturnDialog order={order} onClose={() => setReturning(false)} onDone={refresh} />}
    </Stack>
  );
}
