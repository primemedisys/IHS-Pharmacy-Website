"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FiPrinter } from "react-icons/fi";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { PrintOnly } from "@/features/pharmacy/components/InvoiceView";
import { pharmacyService } from "@/services/pharmacy.service";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDateTime, formatDay } from "@/utils/format";

export default function PurchaseDetailPage() {
  const id = useParams().id as string;
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data: p, isLoading, error, refetch } = useQuery({ queryKey: ["purchase", id], queryFn: () => pharmacyService.getPurchase(id) });

  if (isLoading) return <Loading label="Loading purchase..." />;
  if (error || !p) return <ErrorState description={getApiErrorMessage(error, "Purchase not found")} onRetry={() => refetch()} />;

  const cancel = async () => {
    setBusy(true);
    try {
      await pharmacyService.cancelPurchase(p.id);
      toast.success("Purchase cancelled — its stock was taken back out");
      setConfirm(false);
      await Promise.all(["purchase", "purchases", "my-medicines", "batches", "pharmacy-dashboard"].map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not cancel the purchase"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={3}>
      <PrintOnly />
      <PageTitle
        title={`Purchase ${p.purchaseNumber}`}
        subtitle={`${p.supplier?.name ?? "No supplier"} · invoice ${p.invoiceNumber} · ${formatDay(p.invoiceDate)}`}
        actions={
          <Stack direction="row" spacing={1} className="no-print">
            <Button variant="outlined" startIcon={<FiPrinter />} onClick={() => window.print()}>
              Print
            </Button>
            {p.status === "received" && (
              <Button color="error" variant="outlined" onClick={() => setConfirm(true)}>
                Cancel purchase
              </Button>
            )}
            <Button component={Link} href={ROUTES.PURCHASES}>
              Back
            </Button>
          </Stack>
        }
      />
      {p.status === "cancelled" && <Alert severity="warning">Cancelled {formatDateTime(p.cancelledAt)} — its units were taken back out of stock.</Alert>}

      <Card variant="outlined" className="print-area">
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", mb: 2 }}>
            <div>
              <Typography variant="overline" color="text.secondary">
                Supplier
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {p.supplier?.name ?? "—"}
              </Typography>
              {p.supplier?.gstin && <Typography variant="body2">GSTIN {p.supplier.gstin}</Typography>}
            </div>
            <Stack sx={{ textAlign: { sm: "right" } }}>
              <Typography variant="body2">Invoice {p.invoiceNumber}</Typography>
              <Typography variant="body2">Dated {formatDay(p.invoiceDate)}</Typography>
              <Typography variant="body2">Recorded {formatDateTime(p.createdAt)}</Typography>
              <Chip size="small" sx={{ mt: 0.5, alignSelf: { sm: "flex-end" } }} label={p.status === "received" ? "Received" : "Cancelled"} color={p.status === "received" ? "success" : "default"} />
            </Stack>
          </Stack>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }}>#</TableCell>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Batch / Exp</TableCell>
                  <TableCell align="right">Qty + free</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Disc.</TableCell>
                  <TableCell align="right">Taxable</TableCell>
                  <TableCell align="right">GST</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">MRP / Sell</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(p.items ?? []).map((i, idx) => (
                  <TableRow key={i.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      {i.inventoryId ? (
                        <Link href={ROUTES.MEDICINE_EDIT(i.inventoryId)}>{i.medicineName}</Link>
                      ) : (
                        i.medicineName
                      )}
                    </TableCell>
                    <TableCell>
                      {i.batchNumber ?? "—"}
                      {i.expiryDate ? ` · ${formatDay(i.expiryDate)}` : ""}
                    </TableCell>
                    <TableCell align="right">
                      {i.quantity}
                      {i.freeQuantity ? ` + ${i.freeQuantity}` : ""}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(i.buyingPrice)}</TableCell>
                    <TableCell align="right">{i.discountAmount ? `${formatCurrency(i.discountAmount)} (${i.discountPercent}%)` : "—"}</TableCell>
                    <TableCell align="right">{formatCurrency(i.taxableAmount)}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(i.gstAmount)} ({i.gstRate}%)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatCurrency(i.lineTotal)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(i.mrp)} / {formatCurrency(i.sellingPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack spacing={0.5} sx={{ ml: "auto", mt: 2, maxWidth: 300 }}>
            {[
              ["Gross", p.subtotal],
              ["Trade discount", -p.discountTotal],
              ["Taxable value", p.taxableTotal],
              ["GST", p.gstTotal],
            ].map(([k, v]) => (
              <Stack key={k as string} direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2">{k}</Typography>
                <Typography variant="body2">{formatCurrency(v as number)}</Typography>
              </Stack>
            ))}
            <Divider />
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Invoice total
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {formatCurrency(p.totalAmount)}
              </Typography>
            </Stack>
          </Stack>
          {p.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Notes: {p.notes}
            </Typography>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm}
        title="Cancel this purchase?"
        description="Every unit it added is taken back out of the exact batch it went into. If some were already sold, nothing changes and you'll be told why."
        confirmLabel="Cancel purchase"
        tone="error"
        loading={busy}
        onConfirm={cancel}
        onClose={() => setConfirm(false)}
      />
    </Stack>
  );
}
