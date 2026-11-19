"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRef, useState } from "react";
import { FiCheckCircle, FiDownload, FiFileText, FiUploadCloud } from "react-icons/fi";
import { toast } from "sonner";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { KpiTile } from "@/features/pharmacy/components/KpiTile";
import { pharmacyService } from "@/services/pharmacy.service";
import type { ImportAction, ImportPreview, ImportResult, ImportRow } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";

const ACTION_LABEL: Record<ImportAction, string> = {
  create: "New medicine + add to inventory",
  add: "Existing medicine → add to inventory",
  update: "Update your inventory",
  restore: "Restore removed item",
  skip: "Skip (already in inventory)",
  error: "Not imported",
};

const STATUS_COLOR = { valid: "success", warning: "warning", error: "error" } as const;

/** The row report as CSV, so errors can be fixed in Excel and re-uploaded. */
function downloadReport(rows: ImportRow[], fileName: string) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    ["Row", "Medicine", "Strength", "Batch", "Quantity", "Action", "Status", "Result", "Messages"].map(esc).join(","),
    ...rows.map((r) => [r.row, r.medicineName, r.strength, r.batchNumber, r.quantity, ACTION_LABEL[r.action], r.status, r.result ?? "", r.messages.join(" | ")].map(esc).join(",")),
  ];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function RowsTable({ rows }: { rows: ImportRow[] }) {
  const [tab, setTab] = useState<"all" | "error" | "warning" | "valid">("all");
  const counts = { all: rows.length, error: 0, warning: 0, valid: 0 };
  rows.forEach((r) => (counts[r.status] += 1));
  const shown = tab === "all" ? rows : rows.filter((r) => r.status === tab);
  return (
    <Card variant="outlined">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ px: 1, borderBottom: 1, borderColor: "divider" }}>
        <Tab value="all" label={`All (${counts.all})`} sx={{ textTransform: "none" }} />
        <Tab value="error" label={`Errors (${counts.error})`} sx={{ textTransform: "none" }} />
        <Tab value="warning" label={`Warnings (${counts.warning})`} sx={{ textTransform: "none" }} />
        <Tab value="valid" label={`Valid (${counts.valid})`} sx={{ textTransform: "none" }} />
      </Tabs>
      <TableContainer sx={{ maxHeight: 520, overflow: "auto" }}>
        <Table size="small" stickyHeader sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell>Row</TableCell>
              <TableCell>Medicine</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>What will happen</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Problem / note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={r.row} hover>
                <TableCell>{r.row}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {r.medicineName || "—"}
                  </Typography>
                  {r.strength && (
                    <Typography variant="caption" color="text.secondary">
                      {r.strength}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{r.batchNumber ?? "—"}</TableCell>
                <TableCell align="right">{r.quantity ?? "—"}</TableCell>
                <TableCell>
                  <Typography variant="caption">{r.result ? r.result.toUpperCase() : ACTION_LABEL[r.action]}</Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={r.status} color={STATUS_COLOR[r.status]} variant={r.status === "valid" ? "outlined" : "filled"} />
                </TableCell>
                <TableCell>
                  {r.messages.length ? (
                    r.messages.map((m, i) => (
                      <Typography key={i} variant="caption" sx={{ display: "block" }} color={r.status === "error" ? "error.main" : "text.secondary"}>
                        {m}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="caption" color="text.disabled">
                      —
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

export default function ImportMedicinesPage() {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [strategy, setStrategy] = useState<"skip" | "update">("skip");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<"template" | "preview" | "import" | null>(null);

  const step = result ? 3 : preview ? 2 : file ? 1 : 0;

  const pick = (f: File | null) => {
    setFile(f);
    setPreview(null);
    setResult(null);
  };

  const run = async (kind: "template" | "preview" | "import") => {
    setBusy(kind);
    try {
      if (kind === "template") await pharmacyService.downloadTemplate();
      else if (kind === "preview" && file) setPreview(await pharmacyService.previewImport(file, strategy));
      else if (kind === "import" && file) {
        const r = await pharmacyService.commitImport(file, strategy);
        setResult(r);
        toast.success(`${r.summary.imported} row(s) imported`);
        await queryClient.invalidateQueries({ queryKey: ["my-medicines"] });
        await queryClient.invalidateQueries({ queryKey: ["pharmacy-dashboard"] });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, kind === "template" ? "Could not download the template" : "The file could not be processed"));
    } finally {
      setBusy(null);
    }
  };

  const writable = preview ? preview.summary.toCreate + preview.summary.toUpdate : 0;

  return (
    <Stack spacing={3}>
      <PageTitle
        title="Bulk import medicines"
        subtitle="Add or update many inventory items at once from an Excel sheet"
        actions={
          <Button variant="outlined" startIcon={<FiDownload />} onClick={() => run("template")} loading={busy === "template"}>
            Download template
          </Button>
        }
      />

      <Stepper activeStep={step} alternativeLabel>
        {["Upload file", "Validate & preview", "Import", "Report"].map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Alert severity="info">
        Use the official template — its columns come straight from your inventory fields. <b>Images are optional and are not part of the file:</b> import first,
        then open Medicines → Edit to add photos whenever you like. Matching medicines in the shared catalogue are reused, never duplicated.
      </Alert>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2.5}>
            <Box
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files?.[0] ?? null);
              }}
              sx={{ border: 2, borderStyle: "dashed", borderColor: file ? "primary.main" : "divider", borderRadius: 2, p: 4, textAlign: "center", cursor: "pointer", "&:hover": { borderColor: "primary.main" } }}
            >
              <input ref={input} type="file" hidden accept=".xlsx,.csv" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
              {file ? <FiFileText size={32} /> : <FiUploadCloud size={32} />}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>
                {file ? file.name : "Drop the filled template here, or click to choose"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                .xlsx (or .csv with the same headers) · up to 5,000 rows
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                If a medicine is already in your inventory
              </Typography>
              <RadioGroup row value={strategy} onChange={(e) => { setStrategy(e.target.value as "skip" | "update"); setPreview(null); setResult(null); }}>
                <FormControlLabel value="skip" control={<Radio />} label="Skip it (safe default)" />
                <FormControlLabel value="update" control={<Radio />} label="Update it with the file's values (blank cells keep current values)" />
              </RadioGroup>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" disabled={!file} loading={busy === "preview"} onClick={() => run("preview")}>
                Validate &amp; preview
              </Button>
              <Button variant="contained" color="success" disabled={!preview || !writable || !!result} loading={busy === "import"} onClick={() => run("import")} startIcon={<FiCheckCircle />}>
                Import {writable || ""} row(s)
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Preview writes nothing. Import re-checks the same file on the server and writes all valid rows in one transaction; rows with errors are never imported.
              Stock quantities are SET (not added), so importing the same file twice does not double your stock.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {preview && !result && (
        <Stack spacing={2}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiList" label="Total rows" value={preview.summary.totalRows} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiCheckCircle" label="Valid" value={preview.summary.validRows} color="success" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiAlertTriangle" label="Warnings" value={preview.summary.warningRows} color="warning" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><KpiTile icon="FiXCircle" label="Errors (not imported)" value={preview.summary.errorRows} color="error" /></Grid>
          </Grid>
          <Typography variant="body2" color="text.secondary">
            Will add {preview.summary.toCreate} · update {preview.summary.toUpdate} · skip {preview.summary.toSkip}
            {preview.summary.newCatalogueMedicines ? ` · ${preview.summary.newCatalogueMedicines} new to the shared catalogue` : ""}
            {preview.summary.newSuppliers ? ` · ${preview.summary.newSuppliers} new supplier(s)` : ""}
          </Typography>
          {preview.summary.errorRows > 0 && (
            <Alert severity="warning" action={<Button size="small" onClick={() => downloadReport(preview.rows, "import-validation.csv")}>Download errors</Button>}>
              Fix the rows with errors in your sheet and upload it again — or import the valid rows now and re-upload the rest later.
            </Alert>
          )}
          <RowsTable rows={preview.rows} />
        </Stack>
      )}

      {result && (
        <Stack spacing={2}>
          <Alert severity={result.summary.failed ? "warning" : "success"}>
            Import finished: {result.summary.imported} imported ({result.summary.created} added, {result.summary.updated} updated), {result.summary.skipped} skipped,{" "}
            {result.summary.failed} failed.
          </Alert>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 2.4 }}><KpiTile icon="FiList" label="Total rows" value={result.summary.totalRows} /></Grid>
            <Grid size={{ xs: 6, md: 2.4 }}><KpiTile icon="FiCheckCircle" label="Imported" value={result.summary.imported} color="success" /></Grid>
            <Grid size={{ xs: 6, md: 2.4 }}><KpiTile icon="FiSkipForward" label="Skipped" value={result.summary.skipped} color="info" /></Grid>
            <Grid size={{ xs: 6, md: 2.4 }}><KpiTile icon="FiXCircle" label="Failed" value={result.summary.failed} color="error" /></Grid>
            <Grid size={{ xs: 12, md: 2.4 }}><KpiTile icon="FiAlertTriangle" label="With warnings" value={result.summary.warnings} color="warning" /></Grid>
          </Grid>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<FiDownload />} onClick={() => downloadReport(result.rows, "import-report.csv")}>
              Download report
            </Button>
            <Button component={Link} href={ROUTES.MEDICINES} variant="contained">
              View medicines
            </Button>
            <Button variant="text" onClick={() => pick(null)}>
              Import another file
            </Button>
          </Stack>
          <RowsTable rows={result.rows} />
        </Stack>
      )}
    </Stack>
  );
}
