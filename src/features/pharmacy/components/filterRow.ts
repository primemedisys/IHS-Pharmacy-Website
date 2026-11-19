import type { SxProps, Theme } from "@mui/material/styles";

/**
 * A wrapping row of filter fields. The theme makes every TextField
 * `fullWidth`, which in a row would put each filter on its own line — so the
 * fields fill the width on phones and take their natural (min-)width from
 * `md` up.
 */
export const filterRowSx: SxProps<Theme> = {
  flexWrap: "wrap",
  alignItems: { md: "center" },
  "& > .MuiFormControl-root": { width: { xs: "100%", md: "auto" } },
};
