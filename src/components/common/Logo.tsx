"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import { FiPackage } from "react-icons/fi";

export interface LogoProps {
  compact?: boolean;
  onDark?: boolean;
  sx?: SxProps<Theme>;
  size?: number;
}

export function Logo({ compact = false, onDark = false, sx, size }: LogoProps) {
  const dim = size ?? (compact ? 32 : 42);
  return (
    <Box
      component={Link}
      href="/dashboard"
      aria-label="Indian Health System - Medicine Portal"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          width: dim,
          height: dim,
          borderRadius: (t) => `${t.tokens.radius.sm}px`,
          bgcolor: onDark ? "rgba(255,255,255,0.14)" : "primary.main",
          color: "#fff",
        }}
      >
        <FiPackage size={dim * 0.5} />
      </Box>
      {!compact && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: onDark ? "#fff" : "text.primary",
            lineHeight: 1.2,
          }}
        >
          MedPortal
        </Typography>
      )}
    </Box>
  );
}
