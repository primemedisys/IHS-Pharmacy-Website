"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { orderService } from "@/services/order.service";
import type { OrderGroup } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDateTime } from "@/utils/format";

/**
 * UPI-QR orders: the patient pays the pharmacy's own QR, the platform never
 * sees the money, so the payment stays pending until the pharmacy confirms it.
 * Mirrors the backend's confirm-received guard (which re-validates). UX only.
 */
export const canConfirmUpiPayment = (order: OrderGroup) =>
  order.paymentMethod === "upi_qr" && order.paymentStatus === "pending" && order.status !== "cancelled";

/** "Patient reported paid (ref …)" / "Awaiting UPI payment" — only for pending UPI-QR orders. */
export function UpiPaymentNote({ order }: { order: OrderGroup }) {
  if (!canConfirmUpiPayment(order)) return null;
  const reportedAt = order.payment?.reportedAt;
  if (!reportedAt) {
    return (
      <Typography variant="caption" color="text.secondary">
        Awaiting UPI payment
      </Typography>
    );
  }
  const ref = order.payment?.payerReference;
  return (
    <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
      Patient reported paid{ref ? ` (ref ${ref})` : ""} · {formatDateTime(reportedAt)}
    </Typography>
  );
}

/** "Mark payment received" with a confirm step; renders nothing when not applicable. */
export function MarkPaymentReceivedButton({
  order,
  onDone,
  size = "small",
  variant = "outlined",
}: {
  order: OrderGroup;
  onDone: () => Promise<unknown> | void;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  if (!canConfirmUpiPayment(order)) return null;

  const confirm = async () => {
    setSaving(true);
    try {
      await orderService.confirmPaymentReceived(order.id);
      toast.success(`${order.orderNumber} marked paid`);
      setOpen(false);
      await onDone();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not mark the payment received"));
    } finally {
      setSaving(false);
    }
  };

  const ref = order.payment?.payerReference;
  return (
    <>
      <Button size={size} variant={variant} color="success" startIcon={<FiCheckCircle />} onClick={() => setOpen(true)} sx={{ textTransform: "none" }}>
        Mark payment received
      </Button>
      <ConfirmDialog
        open={open}
        title="Mark payment received?"
        description={
          <>
            Only confirm after you see {formatCurrency(order.totalAmount)} for {order.orderNumber} in your UPI app
            {ref ? ` (patient reported ref ${ref})` : ""}. The platform does not verify UPI QR payments, and this can&apos;t be undone.
          </>
        }
        confirmLabel="Mark received"
        loading={saving}
        onConfirm={confirm}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
