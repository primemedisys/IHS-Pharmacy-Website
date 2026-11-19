"use client";

import MuiPagination from "@mui/material/Pagination";
import type { SxProps, Theme } from "@mui/material/styles";

export interface PaginationProps {
  count: number;
  page: number;
  onChange: (page: number) => void;
  sx?: SxProps<Theme>;
}

export function Pagination({ count, page, onChange, sx }: PaginationProps) {
  if (count <= 1) return null;
  return (
    <MuiPagination
      count={count}
      page={page}
      onChange={(_, value) => onChange(value)}
      color="primary"
      shape="rounded"
      sx={{ display: "flex", justifyContent: "center", ...sx }}
    />
  );
}
