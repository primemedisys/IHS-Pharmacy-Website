"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { DayRangeFilter, type DayRange } from "@/components/forms/DayRangeFilter";
import { PageTitle } from "@/components/typography/PageTitle";
import { Pagination } from "@/components/ui/Pagination";
import { ROUTES } from "@/constants/routes";
import { pharmacyService } from "@/services/pharmacy.service";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDay } from "@/utils/format";
import { filterRowSx } from "@/features/pharmacy/components/filterRow";

function PurchasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierFromUrl = Number(searchParams.get("supplierId")) || "";
  const [supplierId, setSupplierId] = useState<number | "">(supplierFromUrl);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [range, setRange] = useState<DayRange>({});
  const [page, setPage] = useState(1);

  const params = { search: search.trim() || undefined, supplierId: supplierId || undefined, status: status || undefined, ...range, page, limit: 15 };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["purchases", params], queryFn: () => pharmacyService.listPurchases(params), placeholderData: keepPreviousData });
  const { data: suppliers } = useQuery({ queryKey: ["suppliers", "all"], queryFn: () => pharmacyService.listSuppliers({ active: "all", limit: 100 }) });

  return (
    <Stack spacing={3}>
      <PageTitle
        title="Purchases"
        subtitle="Supplier invoices recorded against your stock"
        actions={
          <Button component={Link} href={ROUTES.PURCHASE_NEW} variant="contained" startIcon={<FiPlus />}>
            Record purchase
          </Button>
        }
      />
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} useFlexGap sx={filterRowSx}>
            <TextField
              size="small"
              placeholder="Invoice / purchase no. or medicine"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              slotProps={{ input: { startAdornment: <FiSearch style={{ marginRight: 8, opacity: 0.5 }} /> } }}
              sx={{ minWidth: { md: 280 } }}
            />
            <TextField size="small" select label="Supplier" value={supplierId} onChange={(e) => { setSupplierId(e.target.value === "" ? "" : Number(e.target.value)); setPage(1); }} sx={{ minWidth: 180 }}>
              <MenuItem value="">All suppliers</MenuItem>
              {(suppliers?.suppliers ?? []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} sx={{ minWidth: 140 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
            <DayRangeFilter label="Invoice date" onChange={(r) => { setRange(r); setPage(1); }} />
          </Stack>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loading label="Loading purchases..." />
      ) : error || !data ? (
        <ErrorState description={getApiErrorMessage(error, "Could not load purchases")} onRetry={() => refetch()} />
      ) : data.purchases.length === 0 ? (
        <EmptyState icon="FiTruck" title="No purchases found" description="Record a supplier invoice to add stock with its batches, buying price and GST." />
      ) : (
        <>
          <Card variant="outlined">
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell>Purchase</TableCell>
                    <TableCell>Supplier invoice</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Units</TableCell>
                    <TableCell align="right">Taxable</TableCell>
                    <TableCell align="right">GST</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.purchases.map((p, idx) => (
                    <TableRow key={p.id} hover sx={{ cursor: "pointer" }} onClick={() => router.push(ROUTES.PURCHASE_DETAIL(p.id))}>
                      <TableCell>{(page - 1) * 15 + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.purchaseNumber}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{p.invoiceNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDay(p.invoiceDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>{p.supplier?.name ?? "—"}</TableCell>
                      <TableCell align="right">{p.itemCount}</TableCell>
                      <TableCell align="right">{formatCurrency(p.taxableTotal)}</TableCell>
                      <TableCell align="right">{formatCurrency(p.gstTotal)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(p.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={p.status === "received" ? "Received" : "Cancelled"} color={p.status === "received" ? "success" : "default"} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          <Pagination count={data.totalPages} page={page} onChange={setPage} />
        </>
      )}
    </Stack>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PurchasesContent />
    </Suspense>
  );
}
