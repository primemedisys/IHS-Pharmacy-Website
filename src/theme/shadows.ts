import type { Shadows } from "@mui/material/styles";

const soft = "rgba(16, 33, 71, 0.06)";
const softer = "rgba(16, 33, 71, 0.05)";
const ambient = "rgba(16, 33, 71, 0.04)";

const SMALL =
  `0px 1px 2px 0px ${softer}, ` +
  `0px 2px 6px -1px ${soft}`;

const LARGE =
  `0px 2px 4px -1px ${ambient}, ` +
  `0px 12px 32px -8px ${soft}, ` +
  `0px 24px 48px -16px ${softer}`;

export const shadows: Shadows = [
  "none",
  SMALL, SMALL, SMALL, SMALL,
  LARGE, LARGE, LARGE, LARGE, LARGE,
  LARGE, LARGE, LARGE, LARGE, LARGE,
  LARGE, LARGE, LARGE, LARGE, LARGE,
  LARGE, LARGE, LARGE, LARGE, LARGE,
] as Shadows;
