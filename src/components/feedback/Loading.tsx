import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

export interface LoadingProps {
  label?: string;
  fullScreen?: boolean;
  size?: number;
  sx?: SxProps<Theme>;
}

export function Loading({ label, fullScreen = false, size = 40, sx }: LoadingProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        width: "100%",
        minHeight: fullScreen ? "100dvh" : 200,
        color: "text.secondary",
        ...sx,
      }}
    >
      <CircularProgress size={size} />
      {label && <Typography variant="body2">{label}</Typography>}
    </Box>
  );
}
