import type { TypographyVariantsOptions } from "@mui/material/styles";

/**
 * Type scale — ONE family (Plus Jakarta Sans, injected by `next/font` in the
 * root layout) for headings and body, with system fallbacks for FOUT safety.
 * Sizes use rem so they scale with the user's root font-size;
 * `responsiveFontSizes()` (applied in theme/index) adds per-breakpoint scaling.
 * Weights stay professional: 700 for page titles, 600 for section headings
 * and labels, 400 for body. Numbers use tabular figures where they line up.
 */
const fontFamily = [
  "var(--font-plus-jakarta-sans)",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Helvetica",
  "Arial",
  "sans-serif",
].join(", ");

/** Kept for existing imports — headings use the same family as body text. */
export const displayFontFamily = fontFamily;

export const typography: TypographyVariantsOptions = {
  fontFamily,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: { fontFamily: displayFontFamily, fontWeight: 700, fontSize: "2.25rem", lineHeight: 1.2, letterSpacing: "-0.02em" },
  h2: { fontFamily: displayFontFamily, fontWeight: 700, fontSize: "1.875rem", lineHeight: 1.25, letterSpacing: "-0.015em" },
  h3: { fontFamily: displayFontFamily, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.3, letterSpacing: "-0.01em" },
  h4: { fontFamily: displayFontFamily, fontWeight: 700, fontSize: "1.375rem", lineHeight: 1.3, letterSpacing: "-0.01em" },
  h5: { fontFamily: displayFontFamily, fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4 },
  h6: { fontFamily: displayFontFamily, fontWeight: 600, fontSize: "1rem", lineHeight: 1.45 },
  subtitle1: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.5 },
  subtitle2: { fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.5 },
  body1: { fontWeight: 400, fontSize: "1rem", lineHeight: 1.6 },
  body2: { fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.55 },
  button: { fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.5, letterSpacing: 0, textTransform: "none" },
  caption: { fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.45 },
  overline: { fontWeight: 600, fontSize: "0.6875rem", lineHeight: 1.4, letterSpacing: "0.08em", textTransform: "uppercase" },
};
