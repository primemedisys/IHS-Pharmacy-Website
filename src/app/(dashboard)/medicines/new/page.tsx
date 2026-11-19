"use client";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FiPlus, FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import { z } from "zod";
import { FormContainer } from "@/components/forms/FormContainer";
import { RHFTextField } from "@/components/forms/RHFTextField";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { ImageSlots } from "@/features/medicines/components/ImageSlots";
import { CommercialFields, commercialShape, refineCommercial, toCommercialPayload } from "@/features/pharmacy/components/CommercialFields";
import { SubstitutePicker } from "@/features/medicines/components/SubstitutePicker";
import { medicineService } from "@/services/medicine.service";
import type { MedicineMaster, MedicineMedia, SubstituteMaster } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";

const MEDICINE_TYPES = ["tablet", "capsule", "syrup", "injection", "drops", "cream", "ointment", "gel", "spray", "inhaler", "powder", "other"];

/**
 * One form for both paths. `mode` decides what is required:
 *  - "existing": a global medicine was picked → only this provider's price/stock.
 *  - "new": no match in the catalogue → the medicine's details are required too.
 * No category step: medicines are found by search, so a new medicine is
 * created without one (existing category data is kept, just not asked for).
 */
const medicineSchema = z
  .object({
    mode: z.enum(["existing", "new"]),
    medicineName: z.string().optional(),
    genericName: z.string().optional(),
    medicineType: z.string().optional(),
    strength: z.string().optional(),
    manufacturer: z.string().optional(),
    description: z.string().optional(),
    price: z.string().min(1, "Price is required").refine((v) => Number(v) > 0, "Price must be greater than 0"),
    stock: z.string().min(1, "Stock is required").refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, "Stock must be 0 or more"),
    location: z.string().optional(),
    ...commercialShape,
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    refineCommercial(v, ctx);
    if (v.expiryDate && !v.batchNumber?.trim()) ctx.addIssue({ code: "custom", path: ["batchNumber"], message: "Enter the batch number for this expiry" });
    if (v.mode !== "new") return;
    if (!v.medicineName?.trim()) ctx.addIssue({ code: "custom", path: ["medicineName"], message: "Medicine name is required" });
    if (!v.medicineType?.trim()) ctx.addIssue({ code: "custom", path: ["medicineType"], message: "Medicine type is required" });
  });

type MedicineInput = z.infer<typeof medicineSchema>;

/** Limits the backend enforces (MAX_MEDICINE_IMAGES / MAX_MEDICINE_SUBSTITUTES); the API is the authority. */
const MAX_IMAGES = 4;
const MAX_SUBSTITUTES = 12;

/** An image picked on this page — previewed locally, uploaded after the medicine is saved. */
interface PendingImage {
  key: string;
  file: File;
  url: string;
}

const masterLabel = (m: MedicineMaster) =>
  [m.medicineName, m.strength, m.medicineType].filter(Boolean).join(" · ");

export default function NewMedicinePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<MedicineMaster[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<MedicineMaster | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [substitutes, setSubstitutes] = useState<SubstituteMaster[]>([]);
  // Images / substitutes the picked EXISTING medicine already has (shared).
  const [existingMedia, setExistingMedia] = useState<MedicineMedia | null>(null);
  const previewUrls = useRef(new Set<string>());

  const methods = useForm<MedicineInput>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      mode: "existing",
      medicineName: "",
      genericName: "",
      medicineType: "tablet",
      strength: "",
      manufacturer: "",
      description: "",
      price: "",
      stock: "0",
      location: "",
      mrp: "",
      buyingPrice: "",
      gstRate: "",
      discountPercent: "",
      minStock: "",
      sku: "",
      hsnCode: "",
      packSize: "",
      supplierId: "",
      batchNumber: "",
      expiryDate: "",
    },
  });
  const mode = useWatch({ control: methods.control, name: "mode" });

  // Release every local preview URL when the page goes away.
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // Picking an existing medicine: show its shared images and start from its
  // current substitutes, so saving never silently drops another pharmacy's picks.
  const selectedId = mode === "existing" ? selected?.id : undefined;
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    medicineService
      .getMedia(selectedId)
      .then((m) => {
        if (cancelled) return;
        setExistingMedia(m);
        setSubstitutes(m.substitutes);
      })
      .catch(() => !cancelled && setExistingMedia(null));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const existingImages = selectedId ? existingMedia?.images ?? [] : [];
  const imageRoom = Math.max(0, MAX_IMAGES - existingImages.length);

  const addPending = (files: File[]) => {
    const added = files.map((file) => {
      const url = URL.createObjectURL(file);
      previewUrls.current.add(url);
      return { key: url, file, url };
    });
    setPendingImages((cur) => [...cur, ...added].slice(0, imageRoom));
  };

  const removePending = (key: string) => {
    URL.revokeObjectURL(key);
    previewUrls.current.delete(key);
    setPendingImages((cur) => cur.filter((p) => p.key !== key));
  };

  const onSelectMaster = (v: MedicineMaster | null) => {
    setSelected(v);
    setExistingMedia(null);
    setSubstitutes([]);
    if (v) methods.setValue("mode", "existing");
  };

  /**
   * After the inventory row exists: upload the picked images to the global
   * medicine and save substitutes. Returns false when any step failed — the
   * medicine itself is already saved, so the user is sent to its edit page.
   */
  const saveMedia = async (masterId: number) => {
    let okAll = true;
    for (const p of pendingImages) {
      try {
        await medicineService.uploadImage(masterId, p.file);
      } catch (err) {
        okAll = false;
        toast.error(`${p.file.name}: ${getApiErrorMessage(err, "upload failed")}`);
      }
    }
    const before = (existingMedia?.substitutes ?? []).map((m) => m.id).join(",");
    const after = substitutes.map((m) => m.id).join(",");
    if (after !== before) {
      try {
        await medicineService.setSubstitutes(masterId, substitutes.map((m) => m.id));
      } catch (err) {
        okAll = false;
        toast.error(getApiErrorMessage(err, "Failed to save substitute medicines"));
      }
    }
    return okAll;
  };

  // Typing updates the query; short input clears results right away.
  const onQueryChange = (value: string) => {
    setQuery(value);
    const searchable = value.trim().length >= 2;
    setSearching(searchable);
    if (!searchable) setOptions([]);
  };

  // Case-insensitive search of the GLOBAL catalogue (debounced).
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      medicineService
        .searchMasters(term)
        .then((res) => !cancelled && setOptions(res))
        .catch(() => !cancelled && setOptions([]))
        .finally(() => !cancelled && setSearching(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const startNewMedicine = () => {
    setSelected(null);
    setExistingMedia(null);
    methods.setValue("mode", "new");
    if (query.trim() && !methods.getValues("medicineName")) methods.setValue("medicineName", query.trim());
  };

  const onSubmit = async (values: MedicineInput) => {
    // Prices / GST / discount / cost are re-validated and used by the backend;
    // no image is needed — photos can be added now or any time later.
    const own = {
      ...toCommercialPayload(values),
      stock: Number(values.stock),
      batchNumber: values.batchNumber?.trim() || undefined,
      expiryDate: values.expiryDate || undefined,
      location: values.location || undefined,
    };
    try {
      let created;
      if (values.mode === "existing") {
        if (!selected) {
          toast.error("Search and select a medicine, or add a new one");
          return;
        }
        created = await medicineService.create({ medicineMasterId: selected.id, ...own });
      } else {
        created = await medicineService.create({
          medicineName: values.medicineName?.trim(),
          genericName: values.genericName || undefined,
          medicineType: values.medicineType,
          strength: values.strength || undefined,
          manufacturer: values.manufacturer || undefined,
          description: values.description || undefined,
          ...own,
        });
      }
      const masterId = created.medicineMasterId;
      if (masterId && !(await saveMedia(masterId))) {
        toast.warning("Medicine added — some images or substitutes were not saved. You can retry here.");
        router.push(ROUTES.MEDICINE_EDIT(created.id));
        return;
      }
      toast.success("Medicine added to your medicines");
      router.push(ROUTES.MEDICINES);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create medicine"));
    }
  };

  const providerFields = (
    <>
      <CommercialFields />
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Opening stock
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <RHFTextField<MedicineInput> name="stock" label="Quantity in hand" type="number" required />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <RHFTextField<MedicineInput> name="batchNumber" label="Batch number" helperText="Recommended — enables expiry tracking" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <RHFTextField<MedicineInput> name="expiryDate" label="Expiry date" type="date" slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
      </Grid>
      <RHFTextField<MedicineInput>
        name="location"
        label="Location"
        placeholder="City / State"
        helperText="Leave blank to use your registered location"
      />
    </>
  );

  const mediaFields = (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Medicine Images (optional)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Not required — the medicine saves without images, and you can add them any time from Edit.
        </Typography>
        <ImageSlots
          slots={[
            ...existingImages.map((img) => ({ key: `saved-${img.id}`, url: img.imageUrl })),
            ...pendingImages.map((p) => ({ key: p.key, url: p.url, removable: true })),
          ]}
          max={MAX_IMAGES}
          busy={methods.formState.isSubmitting && pendingImages.length > 0}
          onAdd={addPending}
          onRemove={removePending}
        />
      </Stack>
      <SubstitutePicker
        value={substitutes}
        onChange={setSubstitutes}
        excludeId={selectedId ?? null}
        max={MAX_SUBSTITUTES}
      />
    </Stack>
  );

  return (
    <Stack spacing={3} sx={{ maxWidth: 960, mx: "auto" }}>
      <PageTitle title="Add New Medicine" subtitle="Search the shared medicine list first, then set your own price, GST, discount and opening stock" />

      <Card variant="outlined">
        <CardContent>
          <FormContainer methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              {/* Search Existing Medicine */}
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Search Existing Medicine
                </Typography>
                <Autocomplete<MedicineMaster>
                  options={options}
                  value={selected}
                  loading={searching}
                  filterOptions={(x) => x}
                  getOptionLabel={masterLabel}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  getOptionDisabled={(o) => !!o.inMyInventory}
                  noOptionsText={query.trim().length < 2 ? "Type at least 2 letters" : "No matching medicine — add it as new"}
                  onInputChange={(_, v, reason) => reason !== "reset" && onQueryChange(v)}
                  onChange={(_, v) => onSelectMaster(v)}
                  renderOption={(props, o) => {
                    const { key, ...rest } = props as typeof props & { key: string };
                    return (
                      <Box component="li" key={key} {...rest}>
                        <Stack sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {masterLabel(o)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[o.strength, o.genericName, o.manufacturer].filter(Boolean).join(" · ") || "—"}
                            {o.inMyInventory ? " · already in your medicines" : ""}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search medicine, e.g. Jerodol-SP"
                      slotProps={{
                        ...params.slotProps,
                        input: {
                          ...params.slotProps.input,
                          startAdornment: (
                            <>
                              <FiSearch size={16} style={{ marginLeft: 6 }} />
                              {params.slotProps.input.startAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
                {mode !== "new" && (
                  <Button
                    variant="text"
                    startIcon={<FiPlus />}
                    onClick={startNewMedicine}
                    sx={{ alignSelf: "flex-start", textTransform: "none" }}
                  >
                    Add New Medicine
                  </Button>
                )}
              </Stack>

              {/* Existing global medicine: details are read-only, only price/stock are yours */}
              {mode === "existing" && selected && (
                <Stack spacing={3}>
                  <Alert severity="info">
                    This medicine already exists in the shared list. Its details are shared — you only set your own price and stock.
                  </Alert>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Chip label={selected.medicineName} color="primary" />
                    {selected.strength && <Chip label={selected.strength} variant="outlined" />}
                    <Chip label={selected.medicineType} variant="outlined" />
                    {selected.genericName && <Chip label={`Generic: ${selected.genericName}`} variant="outlined" />}
                    {selected.manufacturer && <Chip label={selected.manufacturer} variant="outlined" />}
                  </Stack>
                  {providerFields}
                  {mediaFields}
                </Stack>
              )}

              {/* New medicine: not in the catalogue yet */}
              {mode === "new" && (
                <Stack spacing={3}>
                  <Alert severity="info" onClose={() => methods.setValue("mode", "existing")}>
                    Adding a new medicine to the shared list. If an identical medicine (same name, strength and type) already exists, it is reused automatically.
                  </Alert>
                  <RHFTextField<MedicineInput> name="medicineName" label="Medicine Name" />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <RHFTextField<MedicineInput> name="genericName" label="Generic Name" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <RHFTextField<MedicineInput> name="medicineType" label="Medicine Type" select>
                        {MEDICINE_TYPES.map((t) => (
                          <MenuItem key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </MenuItem>
                        ))}
                      </RHFTextField>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <RHFTextField<MedicineInput> name="strength" label="Strength" placeholder="e.g. 500 mg" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <RHFTextField<MedicineInput> name="manufacturer" label="Manufacturer" />
                    </Grid>
                  </Grid>

                  <RHFTextField<MedicineInput> name="description" label="Description" multiline rows={3} />

                  {providerFields}
                  {mediaFields}
                </Stack>
              )}

              <Stack direction="row" spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  loading={methods.formState.isSubmitting}
                  disabled={mode === "existing" && !selected}
                >
                  Add to My Medicines
                </Button>
                <Button variant="outlined" onClick={() => router.back()}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </FormContainer>
        </CardContent>
      </Card>
    </Stack>
  );
}
