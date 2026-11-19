"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { diagnosticService } from "@/services/diagnostic.service";
import type { DiagnosticTest } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency } from "@/utils/format";

interface FormState {
  name: string;
  price: string;
  description: string;
  isAvailable: boolean;
}

const EMPTY_FORM: FormState = { name: "", price: "", description: "", isAvailable: true };

export default function DiagnosticTestsPage() {
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Add / edit dialog: `editing` null = closed, "new" = add, a test = edit.
  const [editing, setEditing] = useState<DiagnosticTest | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<Partial<Record<"name" | "price", string>>>({});
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<DiagnosticTest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    diagnosticService
      .listTests()
      .then((list) => {
        if (cancelled) return;
        setTests(list);
        setLoadError(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(true);
        toast.error(getApiErrorMessage(err, "Failed to load tests"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError({});
    setEditing("new");
  };

  const openEdit = (test: DiagnosticTest) => {
    setForm({
      name: test.name,
      price: String(Number(test.price)),
      description: test.description ?? "",
      isAvailable: test.isAvailable,
    });
    setFormError({});
    setEditing(test);
  };

  const handleSave = async () => {
    const errors: typeof formError = {};
    if (!form.name.trim()) errors.name = "Enter the test name";
    const price = Number(form.price);
    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0 || price > 10000000) errors.price = "Enter a valid price";
    setFormError(errors);
    if (Object.keys(errors).length) return;

    const input = {
      name: form.name.trim(),
      price,
      // "" clears an existing description on edit.
      description: form.description.trim(),
      isAvailable: form.isAvailable,
    };
    setSaving(true);
    try {
      if (editing === "new") {
        const created = await diagnosticService.createTest(input);
        setTests((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success("Test added");
      } else if (editing) {
        const updated = await diagnosticService.updateTest(editing.id, input);
        setTests((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Test updated");
      }
      setEditing(null);
    } catch (err) {
      // 409 (duplicate name) carries the backend's own message.
      toast.error(getApiErrorMessage(err, "Failed to save test"));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (test: DiagnosticTest) => {
    setTogglingId(test.id);
    try {
      const updated = await diagnosticService.updateTest(test.id, { isAvailable: !test.isAvailable });
      setTests((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update availability"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await diagnosticService.deleteTest(toDelete.id);
      setTests((prev) => prev.filter((t) => t.id !== toDelete.id));
      toast.success("Test deleted");
      setToDelete(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete test"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <PageTitle
        title="Tests"
        subtitle="The tests your lab offers, with your prices — used when you answer a patient's request"
        actions={
          <Button variant="contained" startIcon={<FiPlus />} onClick={openAdd}>
            Add test
          </Button>
        }
      />

      {loading ? (
        <Loading label="Loading tests..." />
      ) : loadError ? (
        <ErrorState
          description="We couldn't load your tests."
          onRetry={() => {
            setLoading(true);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : tests.length === 0 ? (
        <EmptyState
          icon="FiActivity"
          title="No tests yet — add the tests your lab offers"
          description="Patients see which of their prescribed tests you can do, at your price."
          action={
            <Button variant="contained" startIcon={<FiPlus />} onClick={openAdd}>
              Add test
            </Button>
          }
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {tests.map((test) => (
            <Card key={test.id} variant="outlined" sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: 1, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, minWidth: 0 }}>
                    {test.name}
                  </Typography>
                  <Chip
                    label={test.isAvailable ? "Available" : "Unavailable"}
                    color={test.isAvailable ? "success" : "default"}
                    size="small"
                    variant="outlined"
                    sx={{ flexShrink: 0 }}
                  />
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(test.price)}
                </Typography>
                {test.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                    {test.description}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mt: "auto" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={test.isAvailable}
                        disabled={togglingId === test.id}
                        onChange={() => toggleAvailability(test)}
                      />
                    }
                    label={<Typography variant="caption">Available</Typography>}
                  />
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(test)} aria-label={`Edit ${test.name}`}>
                        <FiEdit2 />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setToDelete(test)} aria-label={`Delete ${test.name}`}>
                        <FiTrash2 />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={editing !== null} onClose={saving ? undefined : () => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing === "new" ? "Add test" : "Edit test"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Test name"
              placeholder="Complete Blood Count (CBC)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={!!formError.name}
              helperText={formError.name}
              autoFocus
              required
              fullWidth
            />
            <TextField
              label="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              error={!!formError.price}
              helperText={formError.price}
              required
              fullWidth
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
                htmlInput: { min: 0, step: "0.01" },
              }}
            />
            <TextField
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              multiline
              minRows={2}
              fullWidth
            />
            <FormControlLabel
              control={<Switch checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} />}
              label="Available"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditing(null)} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" loading={saving}>
            {editing === "new" ? "Add test" : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this test?"
        description={toDelete ? `"${toDelete.name}" will be removed from your catalogue.` : undefined}
        tone="error"
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Stack>
  );
}
