"use client";

import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import { EmptyState } from "./EmptyState";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  sx?: SxProps<Theme>;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  onRetry,
  sx,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon="FiAlertTriangle"
      title={title}
      description={description}
      sx={sx}
      action={
        onRetry ? (
          <Button variant="outlined" color="primary" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}
