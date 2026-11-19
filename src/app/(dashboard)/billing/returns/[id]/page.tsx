"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiPrinter } from "react-icons/fi";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { GstSummaryTable, PrintOnly, StoreBlock } from "@/features/pharmacy/components/InvoiceView";
import { pharmacyService } from "@/services/pharmacy.service";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDateTime } from "@/utils/format";

export default function CreditNotePage() {
  const id = useParams().id as string;
  const { data: note, isLoading, error, refetch } = useQuery({ queryKey: ["return", id], queryFn: () => pharmacyService.getReturn(id) });
  if (isLoading) return <Loading label="Loading credit note..." />;
  if (error || !note) return <ErrorState description={getApiErrorMessage(error, "Credit note not found")} onRetry={() => refetch()} />;

  return (
    <Stack spacing={3}>
      <PrintOnly />
      <PageTitle
        title={`Credit note ${note.creditNoteNumber}`}
        subtitle={`Against order ${note.orderNumber ?? ""}`}
        actions={
          <Stack direction="row" spacing={1} className="no-print">
            <Button variant="outlined" startIcon={<FiPrinter />} onClick={() => window.print()}>
              Print / save PDF
            </Button>
            <Button component={Link} href={ROUTES.ORDER_DETAIL(note.orderGroupId)}>
              View order
            </Button>
          </Stack>
        }
      />
      <Box className="print-area" sx={{ bgcolor: "background.paper", p: { xs: 2, sm: 3 }, border: 1, borderColor: "divider", borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <StoreBlock store={note.store} title="Credit Note" />
          <Stack sx={{ textAlign: { sm: "right" } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {note.creditNoteNumber}
            </Typography>
            <Typography variant="body2">Date: {formatDateTime(note.createdAt)}</Typography>
            <Typography variant="body2">Original invoice: {note.orderNumber}</Typography>
            <Typography variant="body2">Patient: {note.patient?.name ?? "—"}</Typography>
          </Stack>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 56 }}>#</TableCell>
                <TableCell>Medicine</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Net rate</TableCell>
                <TableCell align="right">GST %</TableCell>
                <TableCell align="right">Taxable</TableCell>
                <TableCell align="right">GST</TableCell>
                <TableCell align="right">Refund</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {note.items.map((i, idx) => (
                <TableRow key={i.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{i.medicineName}</TableCell>
                  <TableCell align="right">{i.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(i.unitPrice)}</TableCell>
                  <TableCell align="right">{i.gstRate}%</TableCell>
                  <TableCell align="right">{formatCurrency(i.taxableAmount)}</TableCell>
                  <TableCell align="right">{formatCurrency(i.gstAmount)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatCurrency(i.lineTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 2, justifyContent: "space-between" }}>
          <Box sx={{ overflowX: "auto" }}>
            <GstSummaryTable rows={note.gstSummary ?? []} />
          </Box>
          <Stack spacing={0.5} sx={{ minWidth: 240 }}>
            <Typography variant="body2">Taxable value: {formatCurrency(note.taxableTotal)}</Typography>
            <Typography variant="body2">GST reversed: {formatCurrency(note.gstTotal)}</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Refund due: {formatCurrency(note.refundAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {note.restocked ? "Units returned to stock." : "Units were not resaleable and were not restocked."}
              {note.reason ? ` Reason: ${note.reason}` : ""}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
