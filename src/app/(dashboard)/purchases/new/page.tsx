"use client";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { SupplierDialog } from "@/features/pharmacy/components/SupplierDialog";
import { medicineService } from "@/services/medicine.service";
import { pharmacyService, type PurchaseLineInput } from "@/services/pharmacy.service";
import type { MedicineMaster } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, todayDay } from "@/utils/format";

interface Line {
  key: number;
  master: MedicineMaster | null;
  batchNumber: string;
  expiryDate: string;
  quantity: string;
  freeQuantity: string;
  buyingPrice: string;
  mrp: string;
  sellingPrice: string;
  gstRate: string;
  discountPercent: string;
}

let nextKey = 1;
const emptyLine = (): Line => ({ key: nextKey++, master: null, batchNumber: "", expiryDate: "", quantity: "", freeQuantity: "", buyingPrice: "", mrp: "", sellingPrice: "", gstRate: "", discountPercent: "" });
const label = (m: MedicineMaster) => [m.medicineName, m.strength, m.medicineType].filter(Boolean).join(" · ");

/** Estimate only — the same formula the backend uses (GST added on the discounted purchase value). */
function estimate(l: Line) {
  const qty = Number(l.quantity) || 0;
  const gross = qty * (Number(l.buyingPrice) || 0);
  const discount = (gross * Math.min(Number(l.discountPercent) || 0, 100)) / 100;
  const taxable = gross - discount;
  const gst = (taxable * (Number(l.gstRate) || 0)) / 100;
  return { gross, discount, taxable, gst, total: taxable + gst };
}

/** Catalogue search for one line (debounced); flags medicines already in your inventory. */
function MedicinePicker({ value, onChange }: { value: MedicineMaster | null; onChange: (m: MedicineMaster | null) => void }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<MedicineMaster[]>([]);
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      medicineService.searchMasters(term).then((r) => !cancelled && setOptions(r)).catch(() => !cancelled && setOptions([]));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);
  return (
    <Autocomplete<MedicineMaster>
      options={options}
      value={value}
      filterOptions={(x) => x}
      getOptionLabel={label}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      noOptionsText={query.trim().length < 2 ? "Type at least 2 letters" : "Not in the catalogue — add it under Add Medicine first"}
      onInputChange={(_, v, reason) => reason !== "reset" && setQuery(v)}
      onChange={(_, v) => onChange(v)}
      renderOption={(props, o) => {
        const { key, ...rest } = props as typeof props & { key: string };
        return (
          <Box component="li" key={key} {...rest}>
            <Stack>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {label(o)}
              </Typography>
              <Typography variant="caption" color={o.inMyInventory ? "success.main" : "text.secondary"}>
                {o.inMyInventory ? "In your inventory" : "New to your inventory — needs a selling price"}
              </Typography>
            </Stack>
          </Box>
        );
      }}
      renderInput={(params) => <TextField {...params} label="Medicine *" placeholder="Search medicine" size="small" />}
    />
  );
}

export default function NewPurchasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayDay());
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>(() => [emptyLine()]);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: suppliers, refetch: refetchSuppliers } = useQuery({ queryKey: ["suppliers", "active"], queryFn: () => pharmacyService.listSuppliers({ active: "active", limit: 100 }) });

  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const problems = lines.flatMap((l, i) => {
    const n = i + 1;
    const out: string[] = [];
    if (!l.master) out.push(`Line ${n}: choose a medicine`);
    if (!(Number(l.quantity) >= 1 && Number.isInteger(Number(l.quantity)))) out.push(`Line ${n}: quantity must be a whole number ≥ 1`);
    if (l.buyingPrice === "" || Number(l.buyingPrice) < 0) out.push(`Line ${n}: enter the buying price`);
    if (l.master && !l.master.inMyInventory && !(Number(l.sellingPrice) > 0)) out.push(`Line ${n}: enter a selling price (new to your inventory)`);
    if (l.expiryDate && !l.batchNumber.trim()) out.push(`Line ${n}: a batch number is needed with an expiry date`);
    if (l.mrp && l.sellingPrice && Number(l.sellingPrice) > Number(l.mrp)) out.push(`Line ${n}: selling price is above MRP`);
    return out;
  });
  if (!invoiceNumber.trim()) problems.unshift("Enter the supplier's invoice number");

  const totals = lines.map(estimate).reduce(
    (a, e) => ({ gross: a.gross + e.gross, discount: a.discount + e.discount, taxable: a.taxable + e.taxable, gst: a.gst + e.gst, total: a.total + e.total }),
    { gross: 0, discount: 0, taxable: 0, gst: 0, total: 0 }
  );

  const submit = async () => {
    setSaving(true);
    try {
      const items: PurchaseLineInput[] = lines.flatMap((l) => (l.master ? [{ ...l, master: l.master }] : [])).map((l) => ({
        ...(l.master.inMyInventory && l.master.myInventoryId ? { inventoryId: l.master.myInventoryId } : { medicineMasterId: l.master.id }),
        batchNumber: l.batchNumber.trim() || undefined,
        expiryDate: l.expiryDate || undefined,
        quantity: Number(l.quantity),
        freeQuantity: l.freeQuantity ? Number(l.freeQuantity) : 0,
        buyingPrice: Number(l.buyingPrice),
        mrp: l.mrp ? Number(l.mrp) : undefined,
        sellingPrice: l.sellingPrice ? Number(l.sellingPrice) : undefined,
        gstRate: l.gstRate ? Number(l.gstRate) : 0,
        discountPercent: l.discountPercent ? Number(l.discountPercent) : 0,
      }));
      const purchase = await pharmacyService.createPurchase({
        supplierId: supplierId === "" ? null : supplierId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        notes: notes.trim() || undefined,
        items,
      });
      toast.success(`Purchase ${purchase.purchaseNumber} recorded — stock updated`);
      await Promise.all(["purchases", "my-medicines", "batches", "pharmacy-dashboard"].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
      router.push(ROUTES.PURCHASE_DETAIL(purchase.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not record the purchase"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 1200, mx: "auto" }}>
      <PageTitle title="Record purchase" subtitle="Enter a supplier invoice — stock, batches and buying prices update when you save" />

      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1}>
                <TextField fullWidth size="small" select label="Supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value === "" ? "" : Number(e.target.value))}>
                  <MenuItem value="">No supplier</MenuItem>
                  {(suppliers?.suppliers ?? []).map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Button size="small" onClick={() => setAddingSupplier(true)} sx={{ whiteSpace: "nowrap" }}>
                  + New
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth size="small" label="Supplier invoice no. *" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth size="small" type="date" label="Invoice date *" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        {lines.map((l, i) => {
          const e = estimate(l);
          const isNew = l.master && !l.master.inMyInventory;
          return (
            <Card key={l.key} variant="outlined">
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Line {i + 1}
                    </Typography>
                    {isNew && <Chip size="small" color="info" label="Will be added to your inventory" />}
                  </Stack>
                  <IconButton size="small" aria-label="Remove line" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}>
                    <FiTrash2 size={15} />
                  </IconButton>
                </Stack>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <MedicinePicker value={l.master} onChange={(m) => update(l.key, { master: m })} />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <TextField fullWidth size="small" label="Batch number" value={l.batchNumber} onChange={(ev) => update(l.key, { batchNumber: ev.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <TextField fullWidth size="small" type="date" label="Expiry" value={l.expiryDate} onChange={(ev) => update(l.key, { expiryDate: ev.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  {(
                    [
                      ["quantity", "Qty *"],
                      ["freeQuantity", "Free qty"],
                      ["buyingPrice", "Buying price / unit (excl. GST) *"],
                      ["discountPercent", "Trade discount %"],
                      ["gstRate", "GST %"],
                      ["mrp", "MRP"],
                      ["sellingPrice", isNew ? "Selling price (incl. GST) *" : "New selling price (optional)"],
                    ] as Array<[keyof Line, string]>
                  ).map(([key, text]) => (
                    <Grid key={key} size={{ xs: 6, sm: 4, md: key === "buyingPrice" || key === "sellingPrice" ? 3 : 1.5 }}>
                      <TextField fullWidth size="small" type="number" label={text} value={l[key] as string} onChange={(ev) => update(l.key, { [key]: ev.target.value } as Partial<Line>)} />
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Taxable {formatCurrency(e.taxable)} + GST {formatCurrency(e.gst)} = <b>{formatCurrency(e.total)}</b>
                  {Number(l.freeQuantity) > 0 ? ` · ${Number(l.quantity) + Number(l.freeQuantity)} units into stock` : ""}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
        <Button startIcon={<FiPlus />} onClick={() => setLines((ls) => [...ls, emptyLine()])} sx={{ alignSelf: "flex-start" }}>
          Add line
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ justifyContent: "space-between" }}>
            <Box sx={{ flex: 1 }}>
              {problems.length > 0 ? (
                <Alert severity="warning">
                  {problems.slice(0, 5).map((p) => (
                    <div key={p}>{p}</div>
                  ))}
                  {problems.length > 5 && <div>…and {problems.length - 5} more</div>}
                </Alert>
              ) : (
                <Alert severity="success">Ready to save. The server recomputes every total and records the stock in one transaction.</Alert>
              )}
            </Box>
            <Stack spacing={0.5} sx={{ minWidth: 260 }}>
              {[
                ["Gross", totals.gross],
                ["Trade discount", -totals.discount],
                ["Taxable", totals.taxable],
                ["GST", totals.gst],
              ].map(([k, v]) => (
                <Stack key={k as string} direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2">{k}</Typography>
                  <Typography variant="body2">{formatCurrency(v as number)}</Typography>
                </Stack>
              ))}
              <Divider />
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Estimated total
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {formatCurrency(totals.total)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ pt: 1.5 }}>
                <Button variant="contained" onClick={submit} loading={saving} disabled={problems.length > 0}>
                  Save purchase
                </Button>
                <Button variant="outlined" onClick={() => router.back()} disabled={saving}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {addingSupplier && (
        <SupplierDialog
          supplier={null}
          onClose={() => setAddingSupplier(false)}
          onSaved={async (s) => {
            setAddingSupplier(false);
            await refetchSuppliers();
            setSupplierId(s.id);
          }}
        />
      )}
    </Stack>
  );
}
