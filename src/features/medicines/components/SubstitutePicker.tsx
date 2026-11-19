"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { medicineService } from "@/services/medicine.service";
import type { SubstituteMaster } from "@/types";

export const substituteLabel = (m: SubstituteMaster) =>
  [m.medicineName, m.strength, m.medicineType].filter(Boolean).join(" · ");

interface SubstitutePickerProps {
  value: SubstituteMaster[];
  onChange: (value: SubstituteMaster[]) => void;
  /** The medicine being edited — it can never be its own substitute. */
  excludeId?: number | null;
  max: number;
  disabled?: boolean;
}

/**
 * Pick substitute medicines from the EXISTING global catalogue (the same
 * `/medicine/masters` search the Add Medicine page uses). Selecting one only
 * stores a reference to that medicine — nothing new is ever created here.
 */
export function SubstitutePicker({ value, onChange, excludeId, max, disabled }: SubstitutePickerProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SubstituteMaster[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      medicineService
        .searchMasters(term)
        .then((res) => !cancelled && setOptions(res.filter((m) => m.id !== excludeId)))
        .catch(() => !cancelled && setOptions([]))
        .finally(() => !cancelled && setSearching(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, excludeId]);

  const onQueryChange = (v: string) => {
    setQuery(v);
    const searchable = v.trim().length >= 2;
    setSearching(searchable);
    if (!searchable) setOptions([]);
  };

  const full = value.length >= max;

  return (
    <Autocomplete<SubstituteMaster, true>
      multiple
      disabled={disabled}
      options={options}
      value={value}
      loading={searching}
      filterOptions={(x) => x}
      filterSelectedOptions
      getOptionLabel={substituteLabel}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionDisabled={() => full}
      noOptionsText={query.trim().length < 2 ? "Type at least 2 letters" : "No matching medicine in the catalogue"}
      onInputChange={(_, v, reason) => reason !== "reset" && onQueryChange(v)}
      onChange={(_, v) => onChange(v.slice(0, max))}
      renderValue={(selected, getItemProps) =>
        selected.map((m, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return <Chip key={key} {...itemProps} size="small" color="primary" variant="outlined" label={substituteLabel(m)} />;
        })
      }
      renderOption={(props, o) => {
        const { key, ...rest } = props as typeof props & { key: string };
        return (
          <Box component="li" key={key} {...rest}>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {substituteLabel(o)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {[o.genericName, o.manufacturer].filter(Boolean).join(" · ") || "—"}
              </Typography>
            </Stack>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Substitute Medicines"
          placeholder={full ? `Maximum ${max} substitutes` : "Search medicine, e.g. Zerodol-SP"}
          helperText={`${value.length}/${max} selected · only existing medicines can be chosen`}
        />
      )}
    />
  );
}
