"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import { z } from "zod";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { FormContainer } from "@/components/forms/FormContainer";
import { RHFTextField } from "@/components/forms/RHFTextField";
import { PageTitle } from "@/components/typography/PageTitle";
import { Pagination } from "@/components/ui/Pagination";
import { ROUTES } from "@/constants/routes";
import { MedicineMediaSection } from "@/features/medicines/components/MedicineMediaSection";
import { CommercialFields, commercialShape, refineCommercial, toCommercialPayload } from "@/features/pharmacy/components/CommercialFields";
import { ExpiryChip, StockChip } from "@/features/pharmacy/components/StatusChips";
import { MOVEMENT_LABEL, titleCase } from "@/features/pharmacy/status";
import { medicineService } from "@/services/medicine.service";
import { pharmacyService } from "@/services/pharmacy.service";
import type { Medicine, StockBatch } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDateTime, formatDay } from "@/utils/format";

const schema = z
  .object({
    price: z.string().min(1, "Selling price is required").refine((v) => Number(v) > 0, "Selling price must be greater than 0"),
    location: z.string().optional(),
    ...commercialShape,
  })
  .superRefine(refineCommercial);
type FormValues = z.infer<typeof schema>;

const str = (v: unknown) => (v === null || v === undefined ? "" : String(Number(v)));

function toForm(med: Medicine): FormValues {
  return {
    price: str(med.price),
    mrp: str(med.mrp),
    buyingPrice: str(med.buyingPrice),
    gstRate: str(med.gstRate),
    discountPercent: str(med.discountPercent),
    minStock: str(med.minStock),
    sku: med.sku ?? "",
    hsnCode: med.hsnCode ?? "",
    packSize: med.packSize ?? "",
    supplierId: med.supplierId ?? "",
    location: med.location ?? "",
  };
}

/** Commercial fields form, mounted once the medicine is loaded (so defaults are final). */
function PricingCard({ med, onSaved }: { med: Medicine; onSaved: () => Promise<void> }) {
  const methods = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toForm(med) });
  const onSubmit = async (values: FormValues) => {
    try {
      await medicineService.update(med.id, { ...toCommercialPayload(values, { clearEmpty: true }), location: values.location || "" });
      toast.success("Medicine updated");
      await onSaved();
      methods.reset(values);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update medicine"));
    }
  };
  return (
    <Card variant="outlined">
      <CardContent>
        <FormContainer methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <CommercialFields />
            <RHFTextField<FormValues> name="location" label="Location" placeholder="City / State" />
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" loading={methods.formState.isSubmitting} disabled={!methods.formState.isDirty}>
                Save changes
              </Button>
              <Button variant="outlined" onClick={() => methods.reset(toForm(med))} disabled={!methods.formState.isDirty}>
                Discard
              </Button>
            </Stack>
          </Stack>
        </FormContainer>
      </CardContent>
    </Card>
  );
}

type Dialogs =
  | { kind: "receive" }
  | { kind: "batch"; batch: StockBatch }
  | { kind: "total" }
  | null;

function StockDialog({ med, state, onClose, onDone }: { med: Medicine; state: Exclude<Dialogs, null>; onClose: () => void; onDone: () => Promise<void> }) {
  const batch = state.kind === "batch" ? state.batch : null;
  const [qty, setQty] = useState(batch ? String(batch.quantityAvailable) : state.kind === "total" ? String(med.stock) : "");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiry, setExpiry] = useState(batch?.expiryDate ?? "");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const n = Number(qty);
  const qtyOk = qty !== "" && Number.isInteger(n) && n >= (state.kind === "receive" ? 1 : 0);
  const title = state.kind === "receive" ? "Receive stock" : batch ? `Correct batch ${batch.batchNumber}` : "Correct total stock";

  const submit = async () => {
    setSaving(true);
    try {
      if (state.kind === "receive") {
        await pharmacyService.receiveStock(med.id, {
          quantity: n,
          batchNumber: batchNumber.trim() || undefined,
          expiryDate: expiry || undefined,
          buyingPrice: buyingPrice === "" ? undefined : Number(buyingPrice),
          note: note || undefined,
        });
      } else if (batch) {
        await pharmacyService.updateBatch(med.id, batch.id, { quantityAvailable: n, expiryDate: expiry || null, note: note || undefined });
      } else {
        await medicineService.update(med.id, { stock: n, stockNote: note || undefined });
      }
      toast.success("Stock updated");
      await onDone();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update stock"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {state.kind === "receive" && (
            <Alert severity="info">For stock from a supplier invoice, record a Purchase instead — it keeps the invoice, GST and supplier.</Alert>
          )}
          {state.kind === "total" && (
            <Alert severity="info">
              Only units without a batch ({med.untrackedStock ?? 0}) can change here; correct batch quantities on the batch itself.
            </Alert>
          )}
          <TextField label={state.kind === "receive" ? "Quantity received" : "Quantity in hand"} type="number" value={qty} onChange={(e) => setQty(e.target.value)} error={qty !== "" && !qtyOk} required autoFocus />
          {state.kind === "receive" && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Batch number" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} helperText="Leave blank for untracked stock" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Buying price (excl. GST)" type="number" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} />
              </Grid>
            </Grid>
          )}
          {state.kind !== "total" && (
            <TextField label="Expiry date" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} disabled={state.kind === "receive" && !batchNumber.trim()} />
          )}
          <TextField label="Reason / note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. physical count, damaged strip" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} loading={saving} disabled={!qtyOk}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function History({ id }: { id: number }) {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["movements", id, page, type],
    queryFn: () => pharmacyService.movements(id, { page, limit: 10, type: type || undefined }),
    placeholderData: keepPreviousData,
  });
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Stock history
          </Typography>
          <TextField size="small" select fullWidth={false} label="Type" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">All movements</MenuItem>
            {Object.entries(MOVEMENT_LABEL).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {isLoading ? (
          <Loading size={24} />
        ) : !data?.movements.length ? (
          <Typography variant="body2" color="text.secondary">
            No stock movements recorded yet.
          </Typography>
        ) : (
          <>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 760, "& th": { whiteSpace: "nowrap" } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell>When</TableCell>
                    <TableCell>What</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell align="right">Stock after</TableCell>
                    <TableCell>Note / by</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.movements.map((m, idx) => (
                    <TableRow key={m.id}>
                      <TableCell>{(page - 1) * 10 + idx + 1}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(m.createdAt)}</TableCell>
                      <TableCell>{MOVEMENT_LABEL[m.movementType] ?? m.movementType}</TableCell>
                      <TableCell>{m.batch?.batchNumber ?? "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: m.quantity < 0 ? "error.main" : "success.main" }}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </TableCell>
                      <TableCell align="right">{m.stockAfter}</TableCell>
                      <TableCell>
                        <Typography variant="caption">{[m.note, m.actor].filter(Boolean).join(" · ") || "—"}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Pagination count={data.totalPages} page={page} onChange={setPage} sx={{ mt: 1.5 }} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [toggling, setToggling] = useState(false);

  const { data: med, isLoading, error, refetch } = useQuery({ queryKey: ["my-medicine", id], queryFn: () => medicineService.getOne(id) });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["my-medicine", id] }),
      queryClient.invalidateQueries({ queryKey: ["my-medicines"] }),
      queryClient.invalidateQueries({ queryKey: ["movements", Number(id)] }),
      queryClient.invalidateQueries({ queryKey: ["pharmacy-dashboard"] }),
    ]);
  };

  if (isLoading) return <Loading label="Loading medicine..." />;
  if (error || !med) return <ErrorState description={getApiErrorMessage(error, "Medicine not found")} onRetry={() => refetch()} />;

  const toggleActive = async () => {
    setToggling(true);
    try {
      await medicineService.update(med.id, { isActive: !med.isActive });
      toast.success(med.isActive ? "Deactivated — patients no longer see it" : "Activated");
      await refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update"));
    } finally {
      setToggling(false);
    }
  };

  const batches = med.batches ?? [];

  return (
    <Stack spacing={3} sx={{ maxWidth: 1100, mx: "auto" }}>
      <PageTitle
        title={[med.medicineName, med.strength].filter(Boolean).join(" ")}
        subtitle={[titleCase(med.medicineType), med.genericName, med.manufacturer].filter(Boolean).join(" · ")}
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <FormControlLabel control={<Switch checked={med.isActive} onChange={toggleActive} disabled={toggling} />} label={med.isActive ? "Active" : "Inactive"} />
            <Button variant="outlined" onClick={() => router.push(ROUTES.MEDICINES)}>
              Back
            </Button>
          </Stack>
        }
      />

      <Alert severity="info">
        Name, strength, type and generic name belong to the shared medicine catalogue and can&apos;t be changed here. Everything below is yours alone.
      </Alert>

      <Grid container spacing={1.5}>
        {[
          { label: "Stock", value: <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><span>{med.stock}</span><StockChip status={med.stockStatus} /></Stack> },
          { label: "Reorder level", value: med.minStock ?? "—" },
          { label: "Patient pays / unit", value: formatCurrency(med.effectivePrice ?? med.price) },
          { label: "Gross margin / unit", value: med.unitMargin === null || med.unitMargin === undefined ? "No buying price" : formatCurrency(med.unitMargin) },
          { label: "Nearest expiry", value: med.expiryDate ? <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><span style={{ whiteSpace: "nowrap" }}>{formatDay(med.expiryDate)}</span><ExpiryChip status={med.expiryStatus} /></Stack> : "No batch data" },
        ].map((t) => (
          <Grid key={t.label} size={{ xs: 6, md: 2.4 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {t.label}
                </Typography>
                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 700, "& .MuiStack-root": { flexWrap: "wrap", rowGap: 0.5 } }}>
                  {t.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <PricingCard key={med.updatedAt} med={med} onSaved={refresh} />

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Batches &amp; expiry
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sales draw untracked units first, then batches earliest-expiry-first. Expired batches are never sold.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => setDialog({ kind: "total" })}>
                Correct total
              </Button>
              <Button size="small" variant="contained" startIcon={<FiPlus />} onClick={() => setDialog({ kind: "receive" })}>
                Receive stock
              </Button>
            </Stack>
          </Stack>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 620 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }}>#</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell align="right">In hand</TableCell>
                  <TableCell align="right">Received</TableCell>
                  <TableCell align="right">Buying price</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.map((b, idx) => (
                  <TableRow key={b.id} sx={{ opacity: b.quantityAvailable > 0 ? 1 : 0.5 }}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{b.batchNumber}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <span>{b.expiryDate ? formatDay(b.expiryDate) : "—"}</span>
                        {b.quantityAvailable > 0 && <ExpiryChip status={b.expiryStatus} />}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{b.quantityAvailable}</TableCell>
                    <TableCell align="right">{b.quantityReceived}</TableCell>
                    <TableCell align="right">{formatCurrency(b.buyingPrice)}</TableCell>
                    <TableCell>{b.supplier?.name ?? "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" aria-label="Correct batch" onClick={() => setDialog({ kind: "batch", batch: b })}>
                        <FiEdit2 size={15} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2}>
                    <Chip size="small" label="Untracked (no batch)" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{med.untrackedStock ?? 0}</TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {med.medicineMasterId ? (
        <MedicineMediaSection masterId={med.medicineMasterId} />
      ) : (
        <Alert severity="warning">This item is not linked to the shared catalogue yet, so images can&apos;t be attached.</Alert>
      )}

      <History id={med.id} />

      {dialog && <StockDialog med={med} state={dialog} onClose={() => setDialog(null)} onDone={refresh} />}
    </Stack>
  );
}
