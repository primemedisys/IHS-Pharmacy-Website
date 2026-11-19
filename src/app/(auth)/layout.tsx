"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { FiCheckCircle, FiPackage, FiShield } from "react-icons/fi";
import { Logo } from "@/components/common/Logo";

const highlights = [
  { icon: <FiPackage />, title: "Manage medicines", body: "Add, update and organize your medicine inventory from one place." },
  { icon: <FiCheckCircle />, title: "Process orders", body: "Review and fulfill patient medicine orders efficiently." },
  { icon: <FiShield />, title: "Trusted platform", body: "Part of the Indian Health System — secure, reliable and compliant." },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex" }}>
      {/* Brand panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          width: { md: "44%", lg: "40%" },
          p: { md: 5, lg: 7 },
          color: "primary.contrastText",
          bgcolor: "primary.main",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Logo onDark />
        </Box>

        <Stack spacing={4} sx={{ position: "relative", maxWidth: 420 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
            Medicine Portal.
          </Typography>
          <Stack spacing={2.5}>
            {highlights.map((h) => (
              <Stack key={h.title} direction="row" spacing={2}>
                <Box
                  sx={{
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.14)",
                  }}
                >
                  {h.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{h.title}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                    {h.body}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Typography variant="caption" sx={{ position: "relative", color: "rgba(255,255,255,0.6)" }}>
          © {new Date().getFullYear()} India Health System
        </Typography>
      </Box>

      {/* Form area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "background.default", overflowY: "auto" }}>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 2, py: 4 }}>
          <Box sx={{ width: "100%", maxWidth: 440 }}>
            <Box sx={{ display: { md: "none" }, mb: 3 }}>
              <Logo />
            </Box>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
