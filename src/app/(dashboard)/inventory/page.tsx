"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { Pagination } from "@/components/ui/Pagination";
import { ROUTES } from "@/constants/routes";
import { ExpiryChip, StockChip } from "@/features/pharmacy/components/StatusChips";
import { medicineService } from "@/services/medicine.service";
import { pharmacyService } from "@/services/pharmacy.service";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDay } from "@/utils/format";

type TabKey = "expiring" | "expired" | "batches" | "low" | "out";
const TABS: { value: TabKey; label: string }[] = [
  { value: "expiring", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
  { value: "batches", label: "All batches" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];
const isTab = (v: string | null): v is TabKey => TABS.some((t) => t.value === v);

function BatchesTab({ status, search }: { status: "expiring" | "expired" | "all"; search: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [withinDays, setWithinDays] = useState<number | "">("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const params = { status, search: search || undefined, withinDays: withinDays || undefined, page, limit: 20 };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["batches", params],
    queryFn: () => pharmacyService.listBatches(params),
    placeholderData: keepPreviousData,
  });

  const writeOff = async () => {
    setBusy(true);
    try {
      const r = await pharmacyService.writeOffExpired();
      toast.success(r.units ? `${r.units} expired unit(s) from ${r.batches} batch(es) written off` : "No expired stock to write off");
      setConfirm(false);
      await Promise.all(["batches", "my-medicines", "pharmacy-dashboard"].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Write-off failed"));
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Loading label="Loading batches..." />;
  if (error || !data) return <ErrorState description={getApiErrorMessage(error, "Could not load batches")} onRetry={() => refetch()} />;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
        {status === "expiring" ? (
          <TextField size="small" select fullWidth={false} label="Expiring within" value={withinDays} onChange={(e) => { setWithinDays(e.target.value === "" ? "" : Number(e.target.value)); setPage(1); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">Your setting ({data.withinDays} days)</MenuItem>
            {[30, 60, 90, 180].map((d) => (
              <MenuItem key={d} value={d}>
                {d} days
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <span />
        )}
        {status === "expired" && data.total > 0 && (
          <Button color="error" variant="contained" onClick={() => setConfirm(true)}>
            Write off all expired stock
          </Button>
        )}
      </Stack>
      {status === "expired" && data.total > 0 && (
        <Alert severity="warning">Expired batches are never sold. Writing them off removes the units from your stock total; the batch history is kept.</Alert>
      )}
      {data.batches.length === 0 ? (
        <EmptyState icon="FiCheckCircle" title={status === "expired" ? "No expired stock" : status === "expiring" ? "Nothing expiring in this window" : "No batches recorded"} description={status === "all" ? "Batches are created by purchases, imports and opening stock with a batch number." : undefined} />
      ) : (
        <Card variant="outlined">
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }}>#</TableCell>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell align="right">Days left</TableCell>
                  <TableCell align="right">Units</TableCell>
                  <TableCell align="right">Value at cost</TableCell>
                  <TableCell>Supplier</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.batches.map((b, idx) => (
                  <TableRow key={b.id} hover>
                    <TableCell>{(page - 1) * 20 + idx + 1}</TableCell>
                    <TableCell>
                      <Typography component={Link} href={ROUTES.MEDICINE_EDIT(b.inventoryId)} variant="body2" sx={{ fontWeight: 600, color: "inherit" }}>
                        {[b.inventory.medicineName, b.inventory.strength].filter(Boolean).join(" ")}
                      </Typography>
                    </TableCell>
                    <TableCell>{b.batchNumber}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <span>{b.expiryDate ? formatDay(b.expiryDate) : "—"}</span>
                        <ExpiryChip status={b.expiryStatus} />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{b.daysToExpiry ?? "—"}</TableCell>
                    <TableCell align="right">{b.quantityAvailable}</TableCell>
                    <TableCell align="right">{b.stockValue === null ? "—" : formatCurrency(b.stockValue)}</TableCell>
                    <TableCell>{b.supplier?.name ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
      <Pagination count={data.totalPages} page={page} onChange={setPage} />
      <ConfirmDialog
        open={confirm}
        title="Write off expired stock"
        description={`Remove all ${data.total} expired batch(es) with stock from your sellable total? This is recorded in each item's stock history.`}
        confirmLabel="Write off"
        tone="error"
        loading={busy}
        onConfirm={writeOff}
        onClose={() => setConfirm(false)}
      />
    </Stack>
  );
}

function StockTab({ stockStatus, search }: { stockStatus: "low" | "out"; search: string }) {
  const [page, setPage] = useState(1);
  const params = { stockStatus, search: search || undefined, sort: "stock" as const, order: "asc" as const, page, limit: 20 };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["my-medicines", params], queryFn: () => medicineService.listMy(params), placeholderData: keepPreviousData });
  if (isLoading) return <Loading label="Loading..." />;
  if (error || !data) return <ErrorState description={getApiErrorMessage(error, "Could not load medicines")} onRetry={() => refetch()} />;
  const rows = data.medicines ?? [];
  if (!rows.length) return <EmptyState icon="FiCheckCircle" title={stockStatus === "low" ? "No low-stock medicines" : "Nothing is out of stock"} />;
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 56 }}>#</TableCell>
                <TableCell>Medicine</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Reorder level</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="right">Buying price</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((m, idx) => (
                <TableRow key={m.id} hover>
                  <TableCell>{(page - 1) * 20 + idx + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {[m.medicineName, m.strength].filter(Boolean).join(" ")}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                      <span>{m.stock}</span>
                      <StockChip status={m.stockStatus} />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{m.minStock}</TableCell>
                  <TableCell>{m.supplier?.name ?? "—"}</TableCell>
                  <TableCell align="right">{formatCurrency(m.buyingPrice)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" component={Link} href={ROUTES.MEDICINE_EDIT(m.id)}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      <Pagination count={data.totalPages} page={page} onChange={setPage} />
    </Stack>
  );
}

function InventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("tab");
  const tab: TabKey = isTab(fromUrl) ? fromUrl : "expiring";
  const [search, setSearch] = useState("");

  return (
    <Stack spacing={3}>
      <PageTitle
        title="Stock & expiry"
        subtitle="Batches by expiry, low and out-of-stock items"
        actions={
          <Button component={Link} href={ROUTES.PURCHASE_NEW} variant="contained">
            Record purchase
          </Button>
        }
      />
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => router.replace(`${ROUTES.INVENTORY}?tab=${v}`)} variant="scrollable" scrollButtons="auto">
          {TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} sx={{ textTransform: "none" }} />
          ))}
        </Tabs>
      </Box>
      <TextField
        size="small"
        placeholder="Search medicine…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{ input: { startAdornment: <FiSearch style={{ marginRight: 8, opacity: 0.5 }} /> } }}
        sx={{ maxWidth: 360 }}
      />
      {tab === "expiring" && <BatchesTab key="expiring" status="expiring" search={search.trim()} />}
      {tab === "expired" && <BatchesTab key="expired" status="expired" search={search.trim()} />}
      {tab === "batches" && <BatchesTab key="all" status="all" search={search.trim()} />}
      {tab === "low" && <StockTab key="low" stockStatus="low" search={search.trim()} />}
      {tab === "out" && <StockTab key="out" stockStatus="out" search={search.trim()} />}
    </Stack>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InventoryContent />
    </Suspense>
  );
}
