"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { toast } from "sonner";
import { pharmacyService, type SupplierInput } from "@/services/pharmacy.service";
import type { Supplier } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";

const FIELDS: Array<{ key: keyof SupplierInput; label: string; half?: boolean; placeholder?: string }> = [
  { key: "name", label: "Supplier name *" },
  { key: "contactPerson", label: "Contact person", half: true },
  { key: "phone", label: "Phone", half: true },
  { key: "email", label: "Email", half: true },
  { key: "gstin", label: "GSTIN", half: true, placeholder: "15 characters, e.g. 21ABCDE1234F1Z5" },
  { key: "address", label: "Address" },
];

/** Add / edit dialog. Validation is the backend's (Joi); its field messages are shown inline. */
export function SupplierDialog({ supplier, onClose, onSaved }: { supplier: Supplier | null; onClose: () => void; onSaved: (s: Supplier) => void }) {
  const [values, setValues] = useState<SupplierInput>(() => ({
    name: supplier?.name ?? "",
    contactPerson: supplier?.contactPerson ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    gstin: supplier?.gstin ?? "",
    address: supplier?.address ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const saved = supplier ? await pharmacyService.updateSupplier(supplier.id, values) : await pharmacyService.createSupplier(values);
      toast.success(supplier ? "Supplier updated" : "Supplier added");
      onSaved(saved);
    } catch (err) {
      const details = (err as { response?: { data?: { error?: { details?: Record<string, string[]> } } } })?.response?.data?.error?.details;
      if (details) setErrors(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v[0]])));
      toast.error(getApiErrorMessage(err, "Could not save the supplier"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{supplier ? "Edit supplier" : "Add supplier"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {FIELDS.map((f) => (
            <Grid key={f.key} size={{ xs: 12, sm: f.half ? 6 : 12 }}>
              <TextField
                fullWidth
                label={f.label}
                placeholder={f.placeholder}
                value={(values[f.key] as string) ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                error={!!errors[f.key]}
                helperText={errors[f.key]}
                multiline={f.key === "address"}
                minRows={f.key === "address" ? 2 : undefined}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} loading={saving} disabled={!values.name?.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
