"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { todayDay } from "@/utils/format";

/** Calendar days, inclusive, as "YYYY-MM-DD" — what the pharmacy reports/lists accept. */
export interface DayRange {
  from?: string;
  to?: string;
}

type Preset = "all" | "today" | "7d" | "30d" | "90d" | "month" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom range" },
];

function rangeFor(preset: Preset, from: string, to: string): DayRange {
  const today = todayDay();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: todayDay(-6), to: today };
    case "30d":
      return { from: todayDay(-29), to: today };
    case "90d":
      return { from: todayDay(-89), to: today };
    case "month":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "custom":
      return { from: from || undefined, to: to || undefined };
    default:
      return {};
  }
}

/**
 * Day-based range picker (unlike DateRangeFilter, which emits instants). The
 * backend interprets the days in IST, the calendar the pharmacy works in.
 */
export function DayRangeFilter({
  onChange,
  initial = "all",
  allowAll = true,
  label = "Date",
}: {
  onChange: (range: DayRange) => void;
  initial?: Preset;
  allowAll?: boolean;
  label?: string;
}) {
  const [preset, setPreset] = useState<Preset>(initial);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const update = (next: { preset?: Preset; from?: string; to?: string }) => {
    const p = next.preset ?? preset;
    const f = next.from ?? from;
    const t = next.to ?? to;
    setPreset(p);
    setFrom(f);
    setTo(t);
    if (p === "custom" && f && t && f > t) return; // wait for a valid range
    onChange(rangeFor(p, f, t));
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="day-range-label">{label}</InputLabel>
        <Select labelId="day-range-label" label={label} value={preset} onChange={(e) => update({ preset: e.target.value as Preset })}>
          {PRESETS.filter((p) => allowAll || p.value !== "all").map((p) => (
            <MenuItem key={p.value} value={p.value}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {preset === "custom" && (
        <>
          <TextField
            size="small"
            type="date"
            label="From"
            value={from}
            onChange={(e) => update({ from: e.target.value })}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to || undefined } }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={to}
            onChange={(e) => update({ to: e.target.value })}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from || undefined } }}
          />
        </>
      )}
    </Stack>
  );
}

/** The range a preset produces, for initialising state to match the picker. */
export const initialDayRange = (preset: Preset): DayRange => rangeFor(preset, "", "");
