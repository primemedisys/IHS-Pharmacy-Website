"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { FiDownload, FiEdit2, FiEye, FiEyeOff, FiImage, FiPlus, FiSearch, FiUploadCloud } from "react-icons/fi";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { Pagination } from "@/components/ui/Pagination";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { ExpiryChip, StockChip } from "@/features/pharmacy/components/StatusChips";
import { titleCase } from "@/features/pharmacy/status";
import { medicineService, type ListParams } from "@/services/medicine.service";
import { pharmacyService } from "@/services/pharmacy.service";
import type { Medicine } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDay } from "@/utils/format";
import { filterRowSx } from "@/features/pharmacy/components/filterRow";

type Filters = Required<Pick<ListParams, "sort" | "order" | "active">> & {
  stockStatus: "" | "in" | "low" | "out";
  expiry: "" | "expired" | "expiring" | "valid" | "none";
  supplierId: number | "";
};

const SORTS: { value: string; label: string }[] = [
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "name:desc", label: "Name (Z–A)" },
  { value: "stock:asc", label: "Stock (low first)" },
  { value: "stock:desc", label: "Stock (high first)" },
  { value: "expiry:asc", label: "Expiry (soonest first)" },
  { value: "price:asc", label: "Price (low first)" },
  { value: "price:desc", label: "Price (high first)" },
  { value: "updated:desc", label: "Recently updated" },
];

const name = (m: Medicine) => [m.medicineName, m.strength].filter(Boolean).join(" ");

function Thumb({ med }: { med: Medicine }) {
  return med.primaryImageUrl ? (
    <Avatar variant="rounded" src={med.primaryImageUrl} alt="" sx={{ width: 40, height: 40 }} />
  ) : (
    <Tooltip title="No image — add one from Edit">
      <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: "action.hover", color: "text.disabled" }}>
        <FiImage size={16} />
      </Avatar>
    </Tooltip>
  );
}

export default function MedicinesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ sort: "name", order: "asc", active: "active", stockStatus: "", expiry: "", supplierId: "" });
  const [toggle, setToggle] = useState<Medicine | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const params: ListParams = {
    search: search.trim() || undefined,
    page,
    limit: 15,
    sort: filters.sort,
    order: filters.order,
    active: filters.active,
    stockStatus: filters.stockStatus || undefined,
    expiry: filters.expiry || undefined,
    supplierId: filters.supplierId === "" ? undefined : filters.supplierId,
  };
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["my-medicines", params],
    queryFn: () => medicineService.listMy(params),
    placeholderData: keepPreviousData,
  });
  const { data: suppliers } = useQuery({ queryKey: ["suppliers", "all"], queryFn: () => pharmacyService.listSuppliers({ active: "all", limit: 100 }) });

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const medicines = data?.medicines ?? [];
  const filtered = Boolean(params.search || params.stockStatus || params.expiry || params.supplierId || filters.active !== "active");

  const confirmToggle = async () => {
    if (!toggle) return;
    setBusy(true);
    try {
      await medicineService.update(toggle.id, { isActive: !toggle.isActive });
      toast.success(toggle.isActive ? "Medicine deactivated — patients no longer see it" : "Medicine re-activated");
      setToggle(null);
      await queryClient.invalidateQueries({ queryKey: ["my-medicines"] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update medicine"));
    } finally {
      setBusy(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    try {
      await pharmacyService.exportInventory(filters.active);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Export failed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <PageTitle
        title="Medicines"
        subtitle="Your inventory: prices, GST, discount, stock, batches and expiry"
        actions={
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<FiDownload />} onClick={onExport} loading={exporting}>
              Export
            </Button>
            <Button component={Link} href={ROUTES.MEDICINE_IMPORT} variant="outlined" startIcon={<FiUploadCloud />}>
              Bulk import
            </Button>
            <Button component={Link} href={ROUTES.MEDICINE_NEW} variant="contained" startIcon={<FiPlus />}>
              Add medicine
            </Button>
          </Stack>
        }
      />

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} useFlexGap sx={filterRowSx}>
            <TextField
              size="small"
              placeholder="Search name, generic, manufacturer, SKU, batch…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              slotProps={{ input: { startAdornment: <FiSearch style={{ marginRight: 8, opacity: 0.5 }} /> } }}
              sx={{ minWidth: { md: 300 }, flex: { md: 1 } }}
            />
            <TextField size="small" select label="Stock" value={filters.stockStatus} onChange={(e) => setFilter("stockStatus", e.target.value as Filters["stockStatus"])} sx={{ minWidth: 140 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="in">In stock</MenuItem>
              <MenuItem value="low">Low stock</MenuItem>
              <MenuItem value="out">Out of stock</MenuItem>
            </TextField>
            <TextField size="small" select label="Expiry" value={filters.expiry} onChange={(e) => setFilter("expiry", e.target.value as Filters["expiry"])} sx={{ minWidth: 150 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="expiring">Expiring soon</MenuItem>
              <MenuItem value="valid">Valid</MenuItem>
              <MenuItem value="none">No batch / expiry</MenuItem>
            </TextField>
            <TextField size="small" select label="Supplier" value={filters.supplierId} onChange={(e) => setFilter("supplierId", e.target.value === "" ? "" : Number(e.target.value))} sx={{ minWidth: 160 }}>
              <MenuItem value="">All suppliers</MenuItem>
              {(suppliers?.suppliers ?? []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Status" value={filters.active} onChange={(e) => setFilter("active", e.target.value as Filters["active"])} sx={{ minWidth: 130 }}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="all">All</MenuItem>
            </TextField>
            <TextField
              size="small"
              select
              label="Sort"
              value={`${filters.sort}:${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split(":") as [Filters["sort"], Filters["order"]];
                setFilters((f) => ({ ...f, sort, order }));
                setPage(1);
              }}
              sx={{ minWidth: 190 }}
            >
              {SORTS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loading label="Loading medicines..." />
      ) : error ? (
        <ErrorState description={getApiErrorMessage(error, "Could not load your medicines")} onRetry={() => refetch()} />
      ) : medicines.length === 0 ? (
        <EmptyState
          icon="FiPackage"
          title={filtered ? "No medicines match these filters" : "No medicines yet"}
          description={filtered ? "Change the search or filters." : "Add medicines one by one, or import many at once from Excel."}
          action={
            !filtered ? (
              <Stack direction="row" spacing={1}>
                <Button component={Link} href={ROUTES.MEDICINE_NEW} variant="contained" startIcon={<FiPlus />}>
                  Add medicine
                </Button>
                <Button component={Link} href={ROUTES.MEDICINE_IMPORT} variant="outlined" startIcon={<FiUploadCloud />}>
                  Bulk import
                </Button>
              </Stack>
            ) : undefined
          }
        />
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            {data?.total} medicine(s){isFetching ? " · updating…" : ""}
          </Typography>

          {/* Desktop / tablet table */}
          <Card variant="outlined" sx={{ display: { xs: "none", md: "block" } }}>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 1180, "& th, & td.MuiTableCell-alignRight": { whiteSpace: "nowrap" } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell sx={{ minWidth: 240 }}>Medicine</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell>Nearest expiry</TableCell>
                    <TableCell align="right">Selling price</TableCell>
                    <TableCell align="right">MRP</TableCell>
                    <TableCell align="right">Buying price</TableCell>
                    <TableCell align="right">GST / Disc.</TableCell>
                    <TableCell align="right">Margin / unit</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {medicines.map((med, idx) => (
                    <TableRow key={med.id} hover sx={{ opacity: med.isActive ? 1 : 0.55 }}>
                      <TableCell>{(page - 1) * 15 + idx + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Thumb med={med} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {name(med)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[titleCase(med.medicineType), med.packSize, med.sku && `SKU ${med.sku}`].filter(Boolean).join(" · ")}
                            </Typography>
                            {!med.isActive && <Chip size="small" label="Inactive" sx={{ ml: 1 }} />}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {med.stock}
                          </Typography>
                          <StockChip status={med.stockStatus} />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {med.expiryDate ? (
                          <Stack spacing={0.5}>
                            <Typography variant="caption">
                              {formatDay(med.expiryDate)} · {med.batchNumber}
                            </Typography>
                            <ExpiryChip status={med.expiryStatus} />
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            No batch data
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(med.price)}
                        </Typography>
                        {Number(med.discountPercent) > 0 && (
                          <Typography variant="caption" color="success.main">
                            {formatCurrency(med.effectivePrice)} after disc.
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(med.mrp)}</TableCell>
                      <TableCell align="right">{formatCurrency(med.buyingPrice)}</TableCell>
                      <TableCell align="right">
                        {Number(med.gstRate ?? 0)}% / {Number(med.discountPercent ?? 0)}%
                      </TableCell>
                      <TableCell align="right">
                        {med.unitMargin === null || med.unitMargin === undefined ? (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        ) : (
                          <Typography variant="body2" color={med.unitMargin < 0 ? "error.main" : "success.main"} sx={{ fontWeight: 600 }}>
                            {formatCurrency(med.unitMargin)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{med.supplier?.name ?? "—"}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Tooltip title="Edit price, stock, batches, images">
                          <IconButton component={Link} href={ROUTES.MEDICINE_EDIT(med.id)} size="small" aria-label="Edit">
                            <FiEdit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={med.isActive ? "Deactivate" : "Activate"}>
                          <IconButton size="small" aria-label={med.isActive ? "Deactivate" : "Activate"} onClick={() => setToggle(med)}>
                            {med.isActive ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Mobile cards */}
          <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
            {medicines.map((med) => (
              <Card key={med.id} variant="outlined" sx={{ opacity: med.isActive ? 1 : 0.6 }}>
                <CardContent>
                  <Stack direction="row" spacing={1.5}>
                    <Thumb med={med} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {name(med)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[titleCase(med.medicineType), med.packSize].filter(Boolean).join(" · ")}
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: "wrap", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {formatCurrency(med.effectivePrice ?? med.price)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Stock {med.stock}
                        </Typography>
                        <StockChip status={med.stockStatus} />
                        <ExpiryChip status={med.expiryStatus} />
                      </Stack>
                    </Box>
                    <Stack>
                      <IconButton component={Link} href={ROUTES.MEDICINE_EDIT(med.id)} size="small" aria-label="Edit">
                        <FiEdit2 size={16} />
                      </IconButton>
                      <IconButton size="small" aria-label={med.isActive ? "Deactivate" : "Activate"} onClick={() => setToggle(med)}>
                        {med.isActive ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Pagination count={data?.totalPages ?? 1} page={page} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!toggle}
        title={toggle?.isActive ? "Deactivate medicine" : "Activate medicine"}
        description={
          toggle?.isActive
            ? "Patients will no longer see or order it. Its stock, batches and history are kept, and you can re-activate it any time."
            : "Patients will be able to see and order it again."
        }
        confirmLabel={toggle?.isActive ? "Deactivate" : "Activate"}
        tone={toggle?.isActive ? "warning" : "primary"}
        loading={busy}
        onConfirm={confirmToggle}
        onClose={() => setToggle(null)}
      />
    </Stack>
  );
}
