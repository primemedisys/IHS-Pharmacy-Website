"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { AccentTile, type AccentKey } from "@/components/common/AccentTile";
import { CARD_TONES, type CardTone } from "@/theme/palette";

export interface StatisticCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: "primary" | "secondary" | "success" | "info" | "warning";
  sx?: SxProps<Theme>;
}

const TONE_ACCENT: Partial<Record<string, AccentKey>> = {
  success: "green",
  warning: "orange",
  error: "red",
};

const TONE_CARD: Record<NonNullable<StatisticCardProps["color"]>, CardTone> = {
  primary: "blue",
  secondary: "purple",
  success: "green",
  info: "teal",
  warning: "orange",
};

export function StatisticCard({ icon, value, label, color = "primary", sx }: StatisticCardProps) {
  const card = CARD_TONES[TONE_CARD[color]];
  return (
    <Paper
      variant="outlined"
      sx={{ height: "100%", bgcolor: card.bg, borderColor: card.border, ...sx }}
    >
      <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", p: 3 }}>
        <AccentTile
          icon={icon}
          accent={TONE_ACCENT[color]}
          size={56}
          iconSize={26}
          sx={{ bgcolor: "rgba(255,255,255,0.7)", color: card.fg }}
        />
        <Typography variant="h3" sx={{ fontWeight: 700, color: card.heading }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: card.fg }}>
          {label}
        </Typography>
      </Stack>
    </Paper>
  );
}
