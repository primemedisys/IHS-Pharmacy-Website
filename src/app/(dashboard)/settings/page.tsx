"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { PaymentQrCard } from "@/features/pharmacy/components/PaymentQrCard";
import { pharmacyService } from "@/services/pharmacy.service";
import type { PharmacyStoreSettings } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";

function SettingsForm({ store }: { store: PharmacyStoreSettings }) {
  const queryClient = useQueryClient();
  const [gstin, setGstin] = useState(store.gstin ?? "");
  const [drugLicenseNumber, setLicence] = useState(store.drugLicenseNumber ?? "");
  const [expiryAlertDays, setDays] = useState(String(store.expiryAlertDays));
  const [invoiceNote, setNote] = useState(store.invoiceNote ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      await pharmacyService.updateSettings({ gstin: gstin.trim(), drugLicenseNumber: drugLicenseNumber.trim(), expiryAlertDays: Number(expiryAlertDays), invoiceNote: invoiceNote.trim() });
      toast.success("Settings saved");
      await queryClient.invalidateQueries();
    } catch (err) {
      const details = (err as { response?: { data?: { error?: { details?: Record<string, string[]> } } } })?.response?.data?.error?.details;
      if (details) setErrors(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v[0]])));
      toast.error(getApiErrorMessage(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 820 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {store.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[store.addressLine, store.city, store.state, store.pincode].filter(Boolean).join(", ") || "No address on your account"}
            {store.phone ? ` · ${store.phone}` : ""}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Name, phone and address come from your registered account and appear on every bill.
          </Typography>
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Billing &amp; tax
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} error={!!errors.gstin} helperText={errors.gstin ?? "Printed on tax invoices and credit notes"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Drug licence number" value={drugLicenseNumber} onChange={(e) => setLicence(e.target.value)} error={!!errors.drugLicenseNumber} helperText={errors.drugLicenseNumber} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth multiline minRows={2} label="Invoice footer note" value={invoiceNote} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Goods once sold are returnable within 7 days with bill" />
              </Grid>
            </Grid>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, pt: 1 }}>
              Inventory
            </Typography>
            <TextField
              label="“Expiring soon” window (days)"
              type="number"
              value={expiryAlertDays}
              onChange={(e) => setDays(e.target.value)}
              error={!!errors.expiryAlertDays}
              helperText={errors.expiryAlertDays ?? "Batches expiring within this many days are flagged on the dashboard and Stock & Expiry page"}
              sx={{ maxWidth: 360 }}
            />
            <Stack direction="row">
              <Button variant="contained" onClick={save} loading={saving} disabled={!(Number(expiryAlertDays) >= 1)}>
                Save settings
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <PaymentQrCard />
      <Alert severity="info">Selling prices in this system include GST; buying prices exclude it. GST rates are whatever you set per medicine — none are assumed.</Alert>
    </Stack>
  );
}

export default function SettingsPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["pharmacy-settings"], queryFn: pharmacyService.getSettings });
  return (
    <Stack spacing={3}>
      <PageTitle title="Settings" subtitle="Store details printed on bills, your UPI payment QR and inventory preferences" />
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState description={getApiErrorMessage(error, "Could not load settings")} onRetry={() => refetch()} />
      ) : (
        <SettingsForm store={data} />
      )}
    </Stack>
  );
}
