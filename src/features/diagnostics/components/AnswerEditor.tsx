"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { diagnosticService, type DiagnosticAnswer } from "@/services/diagnostic.service";
import type { DiagnosticRequest, DiagnosticTest } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency } from "@/utils/format";

interface TypedRow {
  key: number;
  name: string;
  /** price for "available" rows, reason for "unavailable" rows */
  extra: string;
}

const toRow = (name: string, extra: string, index: number): TypedRow => ({ key: index + 1, name, extra });
/** Appends an empty row with a key unique within the list. */
const withBlankRow = (prev: TypedRow[]): TypedRow[] => [
  ...prev,
  { key: prev.reduce((max, r) => Math.max(max, r.key), 0) + 1, name: "", extra: "" },
];

const priceString = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "" : String(Number(v)));
const isValidPrice = (v: string) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0;

export interface AnswerEditorProps {
  request: DiagnosticRequest;
  catalogue: DiagnosticTest[];
  onSubmitted: (request: DiagnosticRequest) => void;
  onCancel?: () => void;
}

/**
 * The lab's answer to a request: which tests it can do (from its own catalogue
 * or typed in) at what price, and which it can't. Pre-filled from the previous
 * answer when re-answering. Mount with a `key` so it re-initialises per answer.
 */
export function AnswerEditor({ request, catalogue, onSubmitted, onCancel }: AnswerEditorProps) {
  const catalogueIds = new Set(catalogue.map((t) => t.id));
  const previous = request.tests ?? [];

  // Catalogue test id → price text (present = ticked).
  const [selection, setSelection] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    previous.forEach((t) => {
      if (t.status === "available" && t.diagnosticTestId && catalogueIds.has(t.diagnosticTestId)) {
        init[t.diagnosticTestId] = priceString(t.price);
      }
    });
    return init;
  });
  const [extraAvailable, setExtraAvailable] = useState<TypedRow[]>(() =>
    previous
      .filter((t) => t.status === "available" && !(t.diagnosticTestId && catalogueIds.has(t.diagnosticTestId)))
      .map((t, i) => toRow(t.testName, priceString(t.price), i)),
  );
  const [unavailable, setUnavailable] = useState<TypedRow[]>(() =>
    previous.filter((t) => t.status === "unavailable").map((t, i) => toRow(t.testName, t.reason ?? "", i)),
  );
  const [note, setNote] = useState(request.labNote ?? "");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (test: DiagnosticTest) =>
    setSelection((prev) => {
      const next = { ...prev };
      if (test.id in next) delete next[test.id];
      else next[test.id] = priceString(test.price);
      return next;
    });

  const patchRow = (setter: typeof setUnavailable, key: number, patch: Partial<TypedRow>) =>
    setter((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (setter: typeof setUnavailable, key: number) => setter((prev) => prev.filter((r) => r.key !== key));

  const handleSubmit = async () => {
    const answers: DiagnosticAnswer[] = [];

    for (const [testId, price] of Object.entries(selection)) {
      const test = catalogue.find((t) => t.id === Number(testId));
      if (!isValidPrice(price)) {
        toast.error(`Enter a valid price for ${test?.name ?? "the selected test"}`);
        return;
      }
      answers.push({ status: "available", diagnosticTestId: Number(testId), price: Number(price) });
    }

    for (const row of extraAvailable) {
      if (!row.name.trim() && !row.extra.trim()) continue; // blank row — ignore
      if (!row.name.trim()) {
        toast.error("Every added test needs a name");
        return;
      }
      if (!isValidPrice(row.extra)) {
        toast.error(`Enter a valid price for ${row.name.trim()}`);
        return;
      }
      answers.push({ status: "available", testName: row.name.trim(), price: Number(row.extra) });
    }

    for (const row of unavailable) {
      if (!row.name.trim() && !row.extra.trim()) continue;
      if (!row.name.trim()) {
        toast.error("Every unavailable test needs a name");
        return;
      }
      answers.push({ status: "unavailable", testName: row.name.trim(), reason: row.extra.trim() || undefined });
    }

    if (!answers.length) {
      toast.error("Add at least one available or unavailable test before sending");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await diagnosticService.submitResponse(request.id, answers, note.trim() || undefined);
      toast.success("Response sent — patient notified");
      onSubmitted(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send response"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Available tests
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tick the tests from the prescription your lab can do. The price defaults to your catalogue price and can be changed for this patient.
          </Typography>
          {catalogue.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Your test catalogue is empty.{" "}
              <Button size="small" component={NextLink} href={ROUTES.DIAGNOSTIC_TESTS}>
                Add tests
              </Button>
              {" "}or add the tests below by name.
            </Alert>
          ) : (
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {catalogue.map((test) => {
                const checked = test.id in selection;
                return (
                  <Stack key={test.id} direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
                    <FormControlLabel
                      control={
                        <Checkbox size="small" checked={checked} onChange={() => toggle(test)} disabled={!test.isAvailable && !checked} />
                      }
                      label={
                        <Typography variant="body2" color={test.isAvailable ? "text.primary" : "text.disabled"}>
                          {test.name} — {formatCurrency(test.price)}
                          {!test.isAvailable && (
                            <Chip label="Unavailable" size="small" variant="outlined" sx={{ ml: 1, height: 20, fontSize: "0.65rem" }} />
                          )}
                        </Typography>
                      }
                      sx={{ flex: 1, alignItems: "center", mr: 0 }}
                    />
                    {checked && (
                      <TextField
                        size="small"
                        type="number"
                        label="Price"
                        value={selection[test.id]}
                        onChange={(e) => setSelection((prev) => ({ ...prev, [test.id]: e.target.value }))}
                        slotProps={{
                          input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
                          htmlInput: { min: 0, step: "0.01" },
                        }}
                        sx={{ width: { xs: "100%", sm: 160 } }}
                      />
                    )}
                  </Stack>
                );
              })}
            </Stack>
          )}

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mt: 2, mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Tests not in your catalogue
            </Typography>
            <Button size="small" startIcon={<FiPlus />} onClick={() => setExtraAvailable(withBlankRow)}>
              Add another test
            </Button>
          </Stack>
          <Stack spacing={1}>
            {extraAvailable.map((row) => (
              <Stack key={row.key} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField
                  size="small"
                  placeholder="Test name"
                  value={row.name}
                  onChange={(e) => patchRow(setExtraAvailable, row.key, { name: e.target.value })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  type="number"
                  placeholder="Price"
                  value={row.extra}
                  onChange={(e) => patchRow(setExtraAvailable, row.key, { extra: e.target.value })}
                  slotProps={{
                    input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
                    htmlInput: { min: 0, step: "0.01" },
                  }}
                  sx={{ width: { xs: 130, sm: 160 } }}
                />
                <IconButton size="small" onClick={() => removeRow(setExtraAvailable, row.key)} color="error" aria-label="Remove test">
                  <FiTrash2 />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Not available
            </Typography>
            <Button size="small" startIcon={<FiPlus />} onClick={() => setUnavailable(withBlankRow)}>
              Add
            </Button>
          </Stack>
          {unavailable.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              Add the tests from the prescription your lab doesn&apos;t offer.
            </Typography>
          )}
          <Stack spacing={1} sx={{ mt: 1 }}>
            {unavailable.map((row) => (
              <Stack key={row.key} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField
                  size="small"
                  placeholder="Test name"
                  value={row.name}
                  onChange={(e) => patchRow(setUnavailable, row.key, { name: e.target.value })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  placeholder="Reason (optional)"
                  value={row.extra}
                  onChange={(e) => patchRow(setUnavailable, row.key, { extra: e.target.value })}
                  sx={{ flex: 1 }}
                />
                <IconButton size="small" onClick={() => removeRow(setUnavailable, row.key)} color="error" aria-label="Remove test">
                  <FiTrash2 />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <TextField
        label="Note to patient (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        multiline
        minRows={2}
        fullWidth
      />

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ minWidth: 200 }}>
          {submitting ? "Sending..." : "Send response"}
        </Button>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
