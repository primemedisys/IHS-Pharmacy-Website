"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ChangeEvent } from "react";
import { FiTrash2, FiUpload } from "react-icons/fi";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { pharmacyService } from "@/services/pharmacy.service";
import type { PaymentQr } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";

const QUERY_KEY = ["pharmacy-payment-qr"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;
/** Same rule as the backend's paymentQr validator. */
const UPI_ID = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

function validate(upiId: string, payeeName: string) {
  const errors: Record<string, string> = {};
  if (upiId && !UPI_ID.test(upiId)) errors.upiId = "Enter a valid UPI ID, e.g. mystore@okicici";
  if (payeeName && (payeeName.length < 2 || payeeName.length > 150)) errors.payeeName = "Use 2–150 characters";
  return errors;
}

function statusChip(qr: PaymentQr) {
  if (qr.configured) return <Chip size="small" color="success" label="Active" />;
  if (qr.qrImageUrl) return <Chip size="small" label="Inactive" />;
  return <Chip size="small" color="warning" variant="outlined" label="Not set up" />;
}

function PaymentQrForm({ qr }: { qr: PaymentQr }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [upiId, setUpiId] = useState(qr.upiId ?? "");
  const [payeeName, setPayeeName] = useState(qr.payeeName ?? "");
  const [isActive, setActive] = useState(qr.isActive);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const trimmedUpi = upiId.trim();
  const trimmedName = payeeName.trim();
  const errors = { ...serverErrors, ...validate(trimmedUpi, trimmedName) };
  const hasRow = !!(qr.qrImageUrl || qr.upiId || qr.payeeName || qr.isActive);

  const apply = (next: PaymentQr) => queryClient.setQueryData(QUERY_KEY, next);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Upload a PNG, JPEG or WebP image of your UPI QR");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("The QR image is too large (max 2 MB)");
      return;
    }
    setUploading(true);
    try {
      const next = await pharmacyService.uploadPaymentQrImage(file);
      apply(next);
      setActive(next.isActive);
      toast.success(qr.qrImageUrl ? "QR image replaced" : "QR image uploaded");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not upload the QR image"));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setServerErrors({});
    try {
      const next = await pharmacyService.updatePaymentQr({ upiId: trimmedUpi || null, payeeName: trimmedName || null, isActive });
      apply(next);
      setUpiId(next.upiId ?? "");
      setPayeeName(next.payeeName ?? "");
      setActive(next.isActive);
      toast.success("Payment QR saved");
    } catch (err) {
      const details = (err as { response?: { data?: { error?: { details?: Record<string, string[]> } } } })?.response?.data?.error?.details;
      if (details) setServerErrors(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v[0]])));
      toast.error(getApiErrorMessage(err, "Could not save the payment QR"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      const next = await pharmacyService.removePaymentQr();
      apply(next);
      setUpiId("");
      setPayeeName("");
      setActive(false);
      setServerErrors({});
      setConfirmRemove(false);
      toast.success("Payment QR removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the payment QR"));
    } finally {
      setRemoving(false);
    }
  };

  const clearError = (key: string) =>
    setServerErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: "auto" }}>
          <Stack spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
            <Box
              sx={{
                width: 180,
                height: 180,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.default",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {qr.qrImageUrl ? (
                <Box component="img" src={qr.qrImageUrl} alt="Store UPI QR code" sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, textAlign: "center" }}>
                  No QR uploaded
                </Typography>
              )}
            </Box>
            <input ref={fileInput} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={onFile} />
            <Button size="small" variant="outlined" startIcon={<FiUpload />} loading={uploading} onClick={() => fileInput.current?.click()}>
              {qr.qrImageUrl ? "Replace QR" : "Upload QR"}
            </Button>
            <Typography variant="caption" color="text.secondary">
              PNG, JPEG or WebP · max 2 MB
            </Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: "grow" }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="UPI ID"
              value={upiId}
              onChange={(e) => { setUpiId(e.target.value); clearError("upiId"); }}
              error={!!errors.upiId}
              helperText={errors.upiId ?? "Shown to patients next to the QR, e.g. mystore@okicici"}
            />
            <TextField
              fullWidth
              label="Payee name"
              value={payeeName}
              onChange={(e) => { setPayeeName(e.target.value); clearError("payeeName"); }}
              error={!!errors.payeeName}
              helperText={errors.payeeName ?? "The name patients see in their UPI app when they pay"}
            />
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setActive(e.target.checked)} />}
              label={
                <span>
                  Accept UPI QR payments
                  {isActive && !qr.qrImageUrl && (
                    <Typography component="span" variant="caption" color="warning.main" sx={{ display: "block" }}>
                      Upload your QR image — patients only see this option once it has one.
                    </Typography>
                  )}
                </span>
              }
            />
          </Stack>
        </Grid>
      </Grid>
      <Typography variant="caption" color="text.secondary">
        Patients pay you directly — the platform never receives or verifies the money. Confirm each order&apos;s payment with “Mark payment received” after
        checking your UPI app.
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={save} loading={saving} disabled={Object.keys(validate(trimmedUpi, trimmedName)).length > 0}>
          Save
        </Button>
        {hasRow && (
          <Button color="error" startIcon={<FiTrash2 />} onClick={() => setConfirmRemove(true)} disabled={saving || uploading}>
            Remove
          </Button>
        )}
      </Stack>
      <ConfirmDialog
        open={confirmRemove}
        title="Remove payment QR?"
        description="Your QR image, UPI ID and payee name are deleted, and patients can no longer choose UPI QR when ordering from you. Existing orders are not affected."
        confirmLabel="Remove"
        tone="error"
        loading={removing}
        onConfirm={remove}
        onClose={() => setConfirmRemove(false)}
      />
    </Stack>
  );
}

/** Settings card: the pharmacy's OWN UPI QR that patients scan to pay it directly. */
export function PaymentQrCard() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: QUERY_KEY, queryFn: pharmacyService.getPaymentQr });
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Store payment QR
            </Typography>
            {data && statusChip(data)}
          </Stack>
          {isLoading ? (
            <Loading size={24} />
          ) : error || !data ? (
            <ErrorState description={getApiErrorMessage(error, "Could not load your payment QR")} onRetry={() => refetch()} />
          ) : (
            <PaymentQrForm qr={data} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
