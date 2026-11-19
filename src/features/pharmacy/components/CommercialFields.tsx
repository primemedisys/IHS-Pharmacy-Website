"use client";

import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";
import { RHFTextField } from "@/components/forms/RHFTextField";
import { pharmacyService } from "@/services/pharmacy.service";
import { formatCurrency } from "@/utils/format";

/**
 * The pharmacy's own commercial fields of an inventory row, shared by the Add
 * and Edit medicine forms. Numbers are kept as input strings in the form and
 * converted on submit; the backend re-validates everything (Joi) and is the
 * authority on prices and totals.
 */
export const commercialShape = {
  mrp: z.string().optional(),
  buyingPrice: z.string().optional(),
  gstRate: z.string().optional(),
  discountPercent: z.string().optional(),
  minStock: z.string().optional(),
  sku: z.string().optional(),
  hsnCode: z.string().optional(),
  packSize: z.string().optional(),
  supplierId: z.union([z.number().int().positive(), z.literal("")]).optional(),
};

export interface CommercialValues {
  price: string;
  mrp?: string;
  buyingPrice?: string;
  gstRate?: string;
  discountPercent?: string;
  minStock?: string;
  sku?: string;
  hsnCode?: string;
  packSize?: string;
  supplierId?: number | "";
}

const blank = (v: string | undefined) => v === undefined || v.trim() === "";

/** Field-level rules that need more than one field (price vs MRP) — mirrors the backend. */
export function refineCommercial(v: CommercialValues, ctx: z.RefinementCtx) {
  const num = (key: keyof CommercialValues, label: string, { min = 0, max, integer = false }: { min?: number; max?: number; integer?: boolean } = {}) => {
    const raw = v[key] as string | undefined;
    if (blank(raw)) return;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < min || (max !== undefined && n > max) || (integer && !Number.isInteger(n))) {
      ctx.addIssue({ code: "custom", path: [key], message: `${label} must be ${integer ? "a whole number" : "a number"}${max !== undefined ? ` between ${min} and ${max}` : ` of ${min} or more`}` });
    }
  };
  num("mrp", "MRP", { min: 0.01 });
  num("buyingPrice", "Buying price");
  num("gstRate", "GST %", { max: 100 });
  num("discountPercent", "Discount %", { max: 100 });
  num("minStock", "Minimum stock", { integer: true });
  if (!blank(v.hsnCode) && !/^[0-9]{2,8}$/.test(v.hsnCode!.trim())) ctx.addIssue({ code: "custom", path: ["hsnCode"], message: "HSN code is 2–8 digits" });
  if (!blank(v.mrp) && Number(v.price) > Number(v.mrp)) ctx.addIssue({ code: "custom", path: ["price"], message: "Selling price cannot be more than the MRP" });
}

/** Form strings → API payload. Empty optional numbers are sent as null (cleared) or left out. */
export function toCommercialPayload(v: CommercialValues, { clearEmpty = false } = {}) {
  const optionalNumber = (raw: string | undefined) => (blank(raw) ? (clearEmpty ? null : undefined) : Number(raw));
  const optionalText = (raw: string | undefined) => (blank(raw) ? (clearEmpty ? "" : undefined) : raw!.trim());
  return {
    price: Number(v.price),
    mrp: optionalNumber(v.mrp),
    buyingPrice: optionalNumber(v.buyingPrice),
    gstRate: blank(v.gstRate) ? 0 : Number(v.gstRate),
    discountPercent: blank(v.discountPercent) ? 0 : Number(v.discountPercent),
    ...(blank(v.minStock) ? {} : { minStock: Number(v.minStock) }),
    sku: optionalText(v.sku),
    hsnCode: optionalText(v.hsnCode),
    packSize: optionalText(v.packSize),
    supplierId: v.supplierId === "" || v.supplierId === undefined ? (clearEmpty ? null : undefined) : v.supplierId,
  };
}

/** The same arithmetic the backend uses (GST-inclusive price, item discount) — preview only. */
function preview(v: CommercialValues) {
  const price = Number(v.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const disc = Math.min(Math.max(Number(v.discountPercent) || 0, 0), 100);
  const gst = Math.max(Number(v.gstRate) || 0, 0);
  const effective = Math.round(price * (1 - disc / 100) * 100) / 100;
  const taxable = Math.round((effective / (1 + gst / 100)) * 100) / 100;
  const cost = blank(v.buyingPrice) ? null : Number(v.buyingPrice);
  return { effective, taxable, gstAmount: Math.round((effective - taxable) * 100) / 100, margin: cost === null ? null : Math.round((taxable - cost) * 100) / 100 };
}

const rupee = { input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } };
const percent = { input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } };

export function CommercialFields() {
  const { control } = useFormContext<CommercialValues>();
  const values = useWatch({ control }) as CommercialValues;
  const p = preview(values);
  const { data: suppliers } = useQuery({ queryKey: ["suppliers", "active"], queryFn: () => pharmacyService.listSuppliers({ active: "active", limit: 100 }) });

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Pricing &amp; tax
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <RHFTextField<CommercialValues> name="price" label="Selling price (incl. GST)" type="number" slotProps={rupee} required />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <RHFTextField<CommercialValues> name="mrp" label="MRP" type="number" slotProps={rupee} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <RHFTextField<CommercialValues> name="buyingPrice" label="Buying price (excl. GST)" type="number" slotProps={rupee} helperText="Private — never shown to patients" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
          <RHFTextField<CommercialValues> name="gstRate" label="GST" type="number" slotProps={percent} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
          <RHFTextField<CommercialValues> name="discountPercent" label="Discount" type="number" slotProps={percent} />
        </Grid>
      </Grid>
      {p && (
        <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
          Patient pays <b>{formatCurrency(p.effective)}</b> per unit · taxable value {formatCurrency(p.taxable)} + GST {formatCurrency(p.gstAmount)}
          {p.margin !== null && (
            <>
              {" "}· gross margin{" "}
              <Typography component="span" variant="body2" sx={{ fontWeight: 700, color: p.margin < 0 ? "error.main" : "success.main" }}>
                {formatCurrency(p.margin)}
              </Typography>{" "}
              per unit (excl. GST)
            </>
          )}
        </Alert>
      )}

      <Typography variant="subtitle2" sx={{ fontWeight: 700, pt: 1 }}>
        Item details
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <RHFTextField<CommercialValues> name="minStock" label="Minimum stock (reorder level)" type="number" helperText="Low-stock alert at or below this" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <RHFTextField<CommercialValues> name="packSize" label="Pack size" placeholder="e.g. Strip of 10" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <RHFTextField<CommercialValues> name="sku" label="SKU / item code" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <RHFTextField<CommercialValues> name="hsnCode" label="HSN code" placeholder="e.g. 30049099" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RHFTextField<CommercialValues> name="supplierId" label="Supplier" select helperText={suppliers && !suppliers.suppliers.length ? "Add suppliers under Purchases → Suppliers" : undefined}>
            <MenuItem value="">No supplier</MenuItem>
            {(suppliers?.suppliers ?? []).map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </RHFTextField>
        </Grid>
      </Grid>
    </Stack>
  );
}
