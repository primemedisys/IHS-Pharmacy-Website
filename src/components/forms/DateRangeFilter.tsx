"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { addDays, startOfDay, subDays } from "date-fns";
import { useState } from "react";

export type DatePreset = "all" | "today" | "7d" | "30d" | "custom";

/** `from` inclusive, `to` exclusive — ISO instants of LOCAL day boundaries. */
export interface DateRange {
  from?: string;
  to?: string;
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

/** "2026-09-23" (a date input's value) → local midnight of that day. */
const fromInput = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function toRange(preset: DatePreset, fromDay: string, toDay: string): DateRange {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1).toISOString();
  switch (preset) {
    case "today":
      return { from: today.toISOString(), to: tomorrow };
    case "7d":
      return { from: subDays(today, 6).toISOString(), to: tomorrow };
    case "30d":
      return { from: subDays(today, 29).toISOString(), to: tomorrow };
    case "custom":
      return {
        from: fromDay ? fromInput(fromDay).toISOString() : undefined,
        // The "To" day is included, so the exclusive bound is the day after it.
        to: toDay ? addDays(fromInput(toDay), 1).toISOString() : undefined,
      };
    default:
      return {};
  }
}

/**
 * Request-date filter: a preset dropdown, plus From/To pickers for a custom
 * range. The server filters on the request's real `created_at`, so paging and
 * totals stay correct.
 */
export function DateRangeFilter({ onChange }: { onChange: (range: DateRange) => void }) {
  const [preset, setPreset] = useState<DatePreset>("all");
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");

  const update = (next: { preset?: DatePreset; fromDay?: string; toDay?: string }) => {
    const p = next.preset ?? preset;
    const f = next.fromDay ?? fromDay;
    const t = next.toDay ?? toDay;
    setPreset(p);
    setFromDay(f);
    setToDay(t);
    // An inverted custom range would match nothing — wait for a valid one.
    if (p === "custom" && f && t && f > t) return;
    onChange(toRange(p, f, t));
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
      <FormControl size="small" sx={{ minWidth: 170 }}>
        <InputLabel id="request-date-label">Date</InputLabel>
        <Select
          labelId="request-date-label"
          label="Date"
          value={preset}
          onChange={(e) => update({ preset: e.target.value as DatePreset })}
        >
          {PRESETS.map((p) => (
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
            value={fromDay}
            onChange={(e) => update({ fromDay: e.target.value })}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: toDay || undefined } }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={toDay}
            onChange={(e) => update({ toDay: e.target.value })}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: fromDay || undefined } }}
          />
        </>
      )}
    </Stack>
  );
}
