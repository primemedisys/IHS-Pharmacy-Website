"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { medicineService } from "@/services/medicine.service";
import { prescriptionService } from "@/services/prescription.service";
import type { Medicine, PrescriptionRequest } from "@/types";

const statusColor = (status: string) => {
  const map: Record<string, "warning" | "info" | "primary" | "success" | "error"> = {
    pending: "warning",
    viewed: "info",
    processing: "primary",
    completed: "success",
    rejected: "error",
  };
  return map[status] ?? "default";
};

interface UnavailableRow {
  key: number;
  name: string;
  reason: string;
}

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [request, setRequest] = useState<PrescriptionRequest | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<number, number>>({});
  const [unavailable, setUnavailable] = useState<UnavailableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      prescriptionService.getOne(id),
      medicineService.listMy({ page: 1, limit: 100 }),
    ])
      .then(([req, result]) => {
        setRequest(req);
        setMedicines(result.medicines || []);
      })
      .catch(() => toast.error("Failed to load prescription"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setFileLoading(true);
    prescriptionService
      .getFileBlobUrl(id)
      .then(setFileUrl)
      .catch(() => setFileUrl(null))
      .finally(() => setFileLoading(false));
  }, [id]);

  const toggle = (medicineId: number) => {
    setSelection((prev) => {
      const next = { ...prev };
      if (next[medicineId]) delete next[medicineId];
      else next[medicineId] = 1;
      return next;
    });
  };

  const setQuantity = (medicineId: number, qty: number) => {
    setSelection((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[medicineId];
      else next[medicineId] = Math.max(0, qty);
      return next;
    });
  };

  const addUnavailableRow = () =>
    setUnavailable((prev) => [...prev, { key: Date.now(), name: "", reason: "" }]);

  const updateUnavailableRow = (key: number, patch: Partial<UnavailableRow>) =>
    setUnavailable((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const removeUnavailableRow = (key: number) =>
    setUnavailable((prev) => prev.filter((r) => r.key !== key));

  const handleReject = async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      await prescriptionService.updateStatus(request.id, "rejected");
      toast.success("Prescription request rejected");
      router.push(ROUTES.PRESCRIPTIONS);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!request) return;

    const availableItems = Object.entries(selection)
      .filter(([, qty]) => qty > 0)
      .map(([medicineId, qty]) => ({
        status: "available" as const,
        medicineId: Number(medicineId),
        quantity: qty,
      }));

    const unavailableItems = unavailable
      .filter((u) => u.name.trim())
      .map((u) => ({
        status: "unavailable" as const,
        medicineName: u.name.trim(),
        reason: u.reason.trim() || undefined,
      }));

    const items = [...availableItems, ...unavailableItems];
    if (!items.length) {
      toast.error("Add at least one available or unavailable medicine before submitting");
      return;
    }

    setSubmitting(true);
    try {
      await prescriptionService.submitAvailability(request.id, items);
      toast.success("Availability submitted — patient notified");
      router.push(ROUTES.PRESCRIPTIONS);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit availability");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading label="Loading prescription..." />;

  if (!request) {
    return (
      <Alert severity="warning" sx={{ maxWidth: 480, mx: "auto" }}>
        Prescription not found
      </Alert>
    );
  }

  const isClosed = request.status === "completed" || request.status === "rejected";

  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
      <PageTitle
        title={`Prescription #${request.id}`}
        subtitle="Check availability against your inventory and respond"
      />

      {/* Request summary */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Patient: {request.patient?.name || "N/A"}
                </Typography>
                <Chip label={request.status} color={statusColor(request.status)} size="small" sx={{ textTransform: "capitalize" }} />
              </Stack>
              {request.patient?.phone && (
                <Typography variant="body2" color="text.secondary">
                  Phone: {request.patient.phone}
                </Typography>
              )}
              {request.notes && (
                <Typography variant="body2" color="text.secondary">
                  Notes: {request.notes}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled">
                Shared {new Date(request.createdAt).toLocaleString()}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignItems: "flex-start" }}>
              {!isClosed && (
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  disabled={submitting}
                  onClick={handleReject}
                >
                  Reject
                </Button>
              )}
              <Button size="small" variant="outlined" onClick={() => router.push(ROUTES.PRESCRIPTIONS)}>
                Back
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Prescription file */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Prescription File
          </Typography>
          {fileLoading ? (
            <Box sx={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loading label="Loading file..." />
            </Box>
          ) : fileUrl ? (
            <iframe
              src={fileUrl}
              title="Prescription"
              style={{ width: "100%", height: 480, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8 }}
            />
          ) : (
            <Alert severity="info">The prescription file could not be loaded.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Availability editor */}
      {isClosed ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Availability Summary
            </Typography>
            {(!request.items || request.items.length === 0) && (
              <Typography variant="body2" color="text.secondary">
                No availability has been recorded for this prescription.
              </Typography>
            )}
            <Stack spacing={1}>
              {request.items?.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                >
                  <Typography variant="body2">
                    {item.medicineName}
                    {item.quantity ? ` (qty ${item.quantity})` : ""}
                  </Typography>
                  <Chip
                    label={item.status}
                    color={item.status === "available" ? "success" : "warning"}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Medicines available in my inventory
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tick what you can supply from the prescription. Quantity entered here is what the patient may order.
              </Typography>
              {medicines.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You have no active medicines yet.{" "}
                  <Button size="small" onClick={() => router.push(ROUTES.MEDICINE_NEW)}>
                    Add a medicine
                  </Button>
                </Alert>
              ) : (
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {medicines.map((med) => {
                    const checked = Boolean(selection[med.id]);
                    return (
                      <Stack key={med.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={checked}
                              onChange={() => toggle(med.id)}
                              disabled={med.stock <= 0}
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {med.medicineName}
                              {med.strength ? ` · ${med.strength}` : ""} — ₹{Number(med.price).toFixed(2)}
                              <Typography component="span" variant="caption" color={med.stock > 0 ? "text.secondary" : "error"}>
                                {" "}({med.stock} in stock)
                              </Typography>
                            </Typography>
                          }
                          sx={{ flex: 1, alignItems: "center" }}
                        />
                        {checked && (
                          <TextField
                            size="small"
                            type="number"
                            value={selection[med.id]}
                            onChange={(e) => setQuantity(med.id, Number(e.target.value))}
                            slotProps={{
                              input: {
                                startAdornment: <InputAdornment position="start">Qty</InputAdornment>,
                              },
                              htmlInput: { min: 1, max: med.stock },
                            }}
                            sx={{ width: 140 }}
                          />
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Medicines not available
                </Typography>
                <Button size="small" startIcon={<FiPlus />} onClick={addUnavailableRow}>
                  Add
                </Button>
              </Stack>
              {unavailable.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Add the medicines from the prescription you don&apos;t stock.
                </Typography>
              )}
              <Stack spacing={1} sx={{ mt: 1 }}>
                {unavailable.map((row) => (
                  <Stack key={row.key} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <TextField
                      size="small"
                      placeholder="Medicine name"
                      value={row.name}
                      onChange={(e) => updateUnavailableRow(row.key, { name: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      placeholder="Reason (optional)"
                      value={row.reason}
                      onChange={(e) => updateUnavailableRow(row.key, { reason: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <IconButton size="small" onClick={() => removeUnavailableRow(row.key)} color="error">
                      <FiTrash2 />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Divider />

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ minWidth: 200 }}
            >
              {submitting ? "Submitting..." : "Submit Availability"}
            </Button>
            <Button variant="outlined" onClick={() => router.push(ROUTES.PRESCRIPTIONS)}>
              Cancel
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}