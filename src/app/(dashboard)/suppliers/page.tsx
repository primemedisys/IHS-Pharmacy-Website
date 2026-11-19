"use client";

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
import { FiEdit2, FiEye, FiEyeOff, FiPlus, FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { Pagination } from "@/components/ui/Pagination";
import { ROUTES } from "@/constants/routes";
import { SupplierDialog } from "@/features/pharmacy/components/SupplierDialog";
import { pharmacyService } from "@/services/pharmacy.service";
import type { Supplier } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDay } from "@/utils/format";
import { filterRowSx } from "@/features/pharmacy/components/filterRow";

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"active" | "inactive" | "all">("active");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Supplier | "new" | null>(null);

  const params = { search: search.trim() || undefined, active, page, limit: 20 };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => pharmacyService.listSuppliers(params),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["suppliers"] });

  const toggle = async (s: Supplier) => {
    try {
      await pharmacyService.updateSupplier(s.id, { isActive: !s.isActive });
      toast.success(s.isActive ? "Supplier deactivated (purchase history kept)" : "Supplier activated");
      await invalidate();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update supplier"));
    }
  };

  return (
    <Stack spacing={3}>
      <PageTitle
        title="Suppliers"
        subtitle="Distributors and wholesalers you buy from — private to your pharmacy"
        actions={
          <Button variant="contained" startIcon={<FiPlus />} onClick={() => setEditing("new")}>
            Add supplier
          </Button>
        }
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap sx={filterRowSx}>
        <TextField
          size="small"
          placeholder="Search name, contact, phone, GSTIN…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          slotProps={{ input: { startAdornment: <FiSearch style={{ marginRight: 8, opacity: 0.5 }} /> } }}
          sx={{ minWidth: { sm: 320 } }}
        />
        <TextField size="small" select label="Status" value={active} onChange={(e) => { setActive(e.target.value as typeof active); setPage(1); }} sx={{ minWidth: 140 }}>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="all">All</MenuItem>
        </TextField>
      </Stack>

      {isLoading ? (
        <Loading label="Loading suppliers..." />
      ) : error || !data ? (
        <ErrorState description={getApiErrorMessage(error, "Could not load suppliers")} onRetry={() => refetch()} />
      ) : data.suppliers.length === 0 ? (
        <EmptyState icon="FiBriefcase" title="No suppliers" description="Add the distributors you buy from, then link them to purchases." />
      ) : (
        <>
          <Card variant="outlined" sx={{ display: { xs: "none", md: "block" } }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>GSTIN</TableCell>
                    <TableCell align="right">Purchases</TableCell>
                    <TableCell align="right">Purchase value</TableCell>
                    <TableCell>Last purchase</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.suppliers.map((s, idx) => (
                    <TableRow key={s.id} hover sx={{ opacity: s.isActive ? 1 : 0.55 }}>
                      <TableCell>{(page - 1) * 20 + idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {s.name} {!s.isActive && <Chip size="small" label="Inactive" sx={{ ml: 1 }} />}
                        </Typography>
                        {s.address && (
                          <Typography variant="caption" color="text.secondary">
                            {s.address}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{s.contactPerson || "—"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[s.phone, s.email].filter(Boolean).join(" · ")}
                        </Typography>
                      </TableCell>
                      <TableCell>{s.gstin || "—"}</TableCell>
                      <TableCell align="right">
                        <Link href={`${ROUTES.PURCHASES}?supplierId=${s.id}`}>{s.purchaseCount ?? 0}</Link>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(s.purchaseValue ?? 0)}</TableCell>
                      <TableCell>{s.lastPurchaseDate ? formatDay(s.lastPurchaseDate) : "—"}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <IconButton size="small" aria-label="Edit" onClick={() => setEditing(s)}>
                          <FiEdit2 size={15} />
                        </IconButton>
                        <Tooltip title={s.isActive ? "Deactivate" : "Activate"}>
                          <IconButton size="small" aria-label={s.isActive ? "Deactivate" : "Activate"} onClick={() => toggle(s)}>
                            {s.isActive ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
            {data.suppliers.map((s) => (
              <Card key={s.id} variant="outlined" sx={{ opacity: s.isActive ? 1 : 0.6 }}>
                <CardContent>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <div>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {s.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[s.contactPerson, s.phone, s.gstin].filter(Boolean).join(" · ") || "No contact details"}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {s.purchaseCount ?? 0} purchase(s) · {formatCurrency(s.purchaseValue ?? 0)}
                      </Typography>
                    </div>
                    <Stack>
                      <IconButton size="small" aria-label="Edit" onClick={() => setEditing(s)}>
                        <FiEdit2 size={15} />
                      </IconButton>
                      <IconButton size="small" aria-label="Toggle" onClick={() => toggle(s)}>
                        {s.isActive ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
          <Pagination count={data.totalPages} page={page} onChange={setPage} />
        </>
      )}

      {editing && (
        <SupplierDialog
          supplier={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await invalidate();
          }}
        />
      )}
    </Stack>
  );
}
