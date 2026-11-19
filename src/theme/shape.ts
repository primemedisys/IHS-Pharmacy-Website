import type { ThemeOptions } from "@mui/material/styles";

/**
 * Base corner unit. A numeric `sx` radius multiplies it (`borderRadius: 1.5` =
 * 12px, `2` = 16px — the IHS maximum for a normal card). Named component radii
 * come from `theme.tokens.radius`.
 */
export const shape: ThemeOptions["shape"] = {
  borderRadius: 8,
};
