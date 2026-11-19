"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { AccentTile, type AccentKey } from "@/components/common/AccentTile";

export interface KpiTileProps {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "error";
  href?: string;
}

const TONE_ACCENT: Partial<Record<string, AccentKey>> = {
  success: "green",
  warning: "orange",
  error: "red",
};

/** A compact figure tile — the dense counterpart of StatisticCard for dashboards with many figures. */
export function KpiTile({ icon, label, value, hint, color = "primary", href }: KpiTileProps) {
  const body = (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", p: 2, height: "100%" }}>
      <AccentTile icon={icon} accent={TONE_ACCENT[color]} size={40} iconSize={19} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.disabled" sx={{ display: "block" }} noWrap>
            {hint}
          </Typography>
        )}
      </Box>
    </Stack>
  );
  return (
    <Paper
      variant="outlined"
      component={href ? Link : "div"}
      {...(href ? { href } : {})}
      sx={{ display: "block", height: "100%", textDecoration: "none", color: "inherit", ...(href ? { "&:hover": { borderColor: "grey.300" } } : {}) }}
    >
      {body}
    </Paper>
  );
}
