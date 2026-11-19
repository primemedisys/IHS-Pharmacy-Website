"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import GlobalStyles from "@mui/material/GlobalStyles";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/features/pharmacy/status";
import type { GstRow, Invoice, StoreDetails } from "@/types";
import { formatCurrency, formatDateTime, formatDay } from "@/utils/format";

/**
 * Print only the element marked `.print-area` (the shell, sidebar and buttons
 * are hidden), so the browser's "Save as PDF" produces a clean bill — the same
 * print-based approach the patient invoice page uses; no second PDF system.
 */
export function PrintOnly() {
  return (
    <GlobalStyles
      styles={{
        "@media print": {
          "body *": { visibility: "hidden" },
          ".print-area, .print-area *": { visibility: "visible" },
          ".print-area": { position: "absolute", left: 0, top: 0, width: "100%" },
          ".no-print": { display: "none !important" },
        },
      }}
    />
  );
}

export function StoreBlock({ store, title }: { store: StoreDetails | null | undefined; title: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {store?.name ?? "—"}
      </Typography>
      {store && (
        <Typography variant="body2" color="text.secondary">
          {[store.addressLine, store.city, store.state, store.pincode].filter(Boolean).join(", ") || "Address not set"}
        </Typography>
      )}
      {store?.phone && <Typography variant="body2">Phone: {store.phone}</Typography>}
      <Typography variant="body2">GSTIN: {store?.gstin || "Not registered in Settings"}</Typography>
      {store?.drugLicenseNumber && <Typography variant="body2">Drug Licence: {store.drugLicenseNumber}</Typography>}
    </Stack>
  );
}

export function GstSummaryTable({ rows }: { rows: GstRow[] }) {
  if (!rows.length) return null;
  return (
    <Table size="small" sx={{ maxWidth: 420 }}>
      <TableHead>
        <TableRow>
          <TableCell>GST rate</TableCell>
          <TableCell align="right">Taxable value</TableCell>
          <TableCell align="right">CGST</TableCell>
          <TableCell align="right">SGST</TableCell>
          <TableCell align="right">Total GST</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.gstRate}>
            <TableCell>{r.gstRate}%</TableCell>
            <TableCell align="right">{formatCurrency(r.taxableAmount)}</TableCell>
            {/* Intra-state split shown for reference; the total is what was charged. */}
            <TableCell align="right">{formatCurrency(Math.round(r.gstAmount * 50) / 100)}</TableCell>
            <TableCell align="right">{formatCurrency(r.gstAmount - Math.round(r.gstAmount * 50) / 100)}</TableCell>
            <TableCell align="right">{formatCurrency(r.gstAmount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const Total = ({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) => (
  <Stack direction="row" sx={{ justifyContent: "space-between", gap: 4 }}>
    <Typography variant="body2" sx={{ fontWeight: strong ? 800 : 400 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: strong ? 800 : 600 }}>
      {value}
    </Typography>
  </Stack>
);

/** The pharmacy tax invoice for one order, rendered from the backend's frozen figures (never recomputed here). */
export function InvoiceView({ invoice }: { invoice: Invoice }) {
  const delivery = [invoice.deliveryAddress, invoice.deliveryCity, invoice.deliveryState, invoice.deliveryPincode].filter(Boolean).join(", ");
  return (
    <Box className="print-area" sx={{ bgcolor: "background.paper", p: { xs: 2, sm: 3 }, border: 1, borderColor: "divider", borderRadius: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <StoreBlock store={invoice.store} title="Tax Invoice" />
        <Stack spacing={0.25} sx={{ textAlign: { sm: "right" } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Invoice {invoice.invoiceNumber}
          </Typography>
          <Typography variant="body2">Date: {formatDateTime(invoice.issuedAt)}</Typography>
          <Typography variant="body2">Order status: {ORDER_STATUS_LABEL[invoice.orderStatus] ?? invoice.orderStatus}</Typography>
          {invoice.prescriptionRequestId && <Typography variant="body2">Prescription request #{invoice.prescriptionRequestId}</Typography>}
        </Stack>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" color="text.secondary">
            Billed to
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {invoice.patient?.name ?? "—"}
          </Typography>
          {invoice.patient?.phone && <Typography variant="body2">{invoice.patient.phone}</Typography>}
        </Box>
        <Box sx={{ flex: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Deliver to
          </Typography>
          <Typography variant="body2">{delivery || "—"}</Typography>
        </Box>
      </Stack>

      <TableContainer sx={{ mt: 2, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 820 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}>#</TableCell>
              <TableCell>Medicine</TableCell>
              <TableCell>HSN</TableCell>
              <TableCell>Batch / Exp</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">MRP</TableCell>
              <TableCell align="right">Rate</TableCell>
              <TableCell align="right">Disc.</TableCell>
              <TableCell align="right">GST %</TableCell>
              <TableCell align="right">Taxable</TableCell>
              <TableCell align="right">GST</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.lines.map((l, i) => (
              <TableRow key={i}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {[l.medicineName, l.strength].filter(Boolean).join(" ")}
                  </Typography>
                  {l.packSize && (
                    <Typography variant="caption" color="text.secondary">
                      {l.packSize}
                    </Typography>
                  )}
                  {l.returnedQuantity > 0 && (
                    <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
                      {l.returnedQuantity} returned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{l.hsnCode || "—"}</TableCell>
                <TableCell>
                  {l.batches.length
                    ? l.batches.map((b, j) => (
                        <Typography key={j} variant="caption" sx={{ display: "block", whiteSpace: "nowrap" }}>
                          {b.batchNumber} · {b.expiryDate ? formatDay(b.expiryDate) : "no exp"} ({b.quantity})
                        </Typography>
                      ))
                    : "—"}
                </TableCell>
                <TableCell align="right">{l.quantity}</TableCell>
                <TableCell align="right">{l.mrp === null ? "—" : formatCurrency(l.mrp)}</TableCell>
                <TableCell align="right">{formatCurrency(l.unitPrice)}</TableCell>
                <TableCell align="right">{l.discountAmount ? `${formatCurrency(l.discountAmount)} (${l.discountPercent}%)` : "—"}</TableCell>
                <TableCell align="right">{l.taxableAmount === null ? "—" : `${l.gstRate}%`}</TableCell>
                <TableCell align="right">{l.taxableAmount === null ? "—" : formatCurrency(l.taxableAmount)}</TableCell>
                <TableCell align="right">{l.taxableAmount === null ? "—" : formatCurrency(l.gstAmount)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatCurrency(l.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 2, justifyContent: "space-between", alignItems: { md: "flex-start" } }}>
        <Box sx={{ overflowX: "auto" }}>
          {invoice.gstRecorded ? (
            <GstSummaryTable rows={invoice.gstSummary} />
          ) : (
            <Alert severity="info" sx={{ maxWidth: 420 }}>
              This order was placed before GST details were recorded, so no tax breakdown is shown.
            </Alert>
          )}
        </Box>
        <Stack spacing={0.75} sx={{ minWidth: 260 }}>
          <Total label="Subtotal (selling price × qty)" value={formatCurrency(invoice.subtotal)} />
          <Total label="Item discount" value={`− ${formatCurrency(invoice.discountTotal)}`} />
          {invoice.taxableTotal !== null && <Total label="Taxable value" value={formatCurrency(invoice.taxableTotal)} />}
          {invoice.taxableTotal !== null && <Total label="GST (included)" value={formatCurrency(invoice.gstTotal)} />}
          <Divider />
          <Total label="Grand total" value={formatCurrency(invoice.total)} strong />
          {invoice.refundedTotal > 0 && (
            <>
              <Total label="Refunded (credit notes)" value={`− ${formatCurrency(invoice.refundedTotal)}`} />
              <Total label="Net after returns" value={formatCurrency(invoice.netAfterReturns)} strong />
            </>
          )}
          <Typography variant="caption" color="text.secondary">
            Prices include GST. Payment: {PAYMENT_METHOD_LABEL[invoice.paymentMethod]} · {PAYMENT_STATUS_LABEL[invoice.paymentStatus]}
            {invoice.payment?.reference ? ` · Ref ${invoice.payment.reference}` : ""}
          </Typography>
          {invoice.payment?.simulated && invoice.paymentMethod === "online" && (
            <Typography variant="caption" color="warning.main">
              Online payments are simulated on this platform — no money was transferred.
            </Typography>
          )}
        </Stack>
      </Stack>

      {invoice.returns.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Credit notes
          </Typography>
          {invoice.returns.map((r) => (
            <Typography key={r.id} variant="body2">
              {r.creditNoteNumber} · {formatDateTime(r.createdAt)} · {formatCurrency(r.refundAmount)} {r.restocked ? "(restocked)" : "(not restocked)"}
            </Typography>
          ))}
        </Box>
      )}

      {invoice.store?.invoiceNote && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          {invoice.store.invoiceNote}
        </Typography>
      )}
    </Box>
  );
}
