import type { PaletteOptions } from "@mui/material/styles";

/**
 * Brand ramps — the single source of truth for hue. Consume only via the theme
 * palette (or `theme.tokens.surface` for the tinted status backgrounds); never
 * reference these hex values in components.
 *
 * IHS colour language (shared by every IHS web app — 2026-11 hospital refresh):
 *   • White   — the page AND every card, sidebar, top bar, table and form.
 *               Cards are separated by a neutral border, not a tinted canvas.
 *   • Neutral grey (#F5F6F7 / #F0F1F2) — table headers, section headers,
 *               quiet fills. Never blue-tinted.
 *   • Deep navy (#17365D) — ONLY primary actions, the active navigation item,
 *               selected controls and important links.
 *   • Green / orange / red — success / pending-warning / danger, by meaning.
 * Headings and body text are near-black ink (#202733), not navy.
 */
const navy = {
  300: "#7C93B4",
  400: "#4F6B91",
  500: "#2E5384",
  600: "#102B5C", // primary (13.6:1 on white)
  700: "#0A1F45", // primary hover
  800: "#071733",
};

/** Neutral ink / grey ramp — no blue cast. */
const neutral = {
  50: "#F4F5F4", // secondary neutral surface
  100: "#F0F1F2", // subtle alternate surface
  200: "#E4E7E5", // border
  300: "#D0D4DA", // input border
  400: "#A3AAB4",
  500: "#8A929E", // muted text
  600: "#667085", // secondary text (4.9:1)
  700: "#4B5361",
  800: "#353C48",
  900: "#202733", // main text
  950: "#14181F",
};

export const lightPalette: PaletteOptions = {
  mode: "light",
  primary: { main: navy[600], light: navy[500], dark: navy[700], contrastText: "#FFFFFF" },
  // Secondary is a neutral slate: avatars, quiet icons, the selection colour.
  secondary: { main: neutral[700], light: neutral[500], dark: neutral[800], contrastText: "#FFFFFF" },
  success: { main: "#198754", light: "#4CAF7A", dark: "#0F6238", contrastText: "#FFFFFF" },
  warning: { main: "#E68A19", light: "#F2A541", dark: "#B45309", contrastText: "#1C1206" },
  error: { main: "#DC3545", light: "#E57373", dark: "#A71D2A", contrastText: "#FFFFFF" },
  // Informational states stay neutral — no light-blue boxes.
  info: { main: neutral[700], light: neutral[500], dark: neutral[800], contrastText: "#FFFFFF" },
  background: { default: "#FFFFFF", paper: "#FFFFFF" },
  text: { primary: neutral[900], secondary: neutral[600], disabled: neutral[500] },
  divider: "#E4E7E5",
  grey: {
    50: neutral[50],
    100: neutral[100],
    200: neutral[200],
    300: neutral[300],
    400: neutral[400],
    500: neutral[500],
    600: neutral[600],
    700: neutral[700],
    800: neutral[800],
    900: neutral[900],
  },
};

export const darkPalette: PaletteOptions = {
  mode: "dark",
  primary: { main: "#8FB0DA", light: "#B5CBE8", dark: navy[400], contrastText: "#0B1524" },
  secondary: { main: neutral[400], light: neutral[300], dark: neutral[600], contrastText: "#0B1524" },
  success: { main: "#5CC48D", light: "#8BD8AE", dark: "#16804A", contrastText: "#06210F" },
  warning: { main: "#F2A541", light: "#F7C27A", dark: "#D97706", contrastText: "#1C1206" },
  error: { main: "#EF7B7B", light: "#F5A5A5", dark: "#C62828", contrastText: "#1A0708" },
  info: { main: neutral[400], light: neutral[300], dark: neutral[600], contrastText: "#0B1524" },
  background: { default: neutral[950], paper: "#1B2029" },
  text: { primary: "#ECEEF1", secondary: "#A9B0BA", disabled: "#6B7380" },
  divider: "rgba(236, 238, 241, 0.12)",
  grey: {
    50: "#1F242D",
    100: "#252B35",
    200: "#2F3642",
    300: neutral[800],
    400: neutral[700],
    500: neutral[600],
    600: neutral[500],
    700: neutral[400],
    800: neutral[300],
    900: neutral[200],
  },
};

/**
 * Tinted backgrounds for status blocks (alerts, badges, row highlights) and
 * the two neutral surfaces. Exposed as `theme.tokens.surface`.
 */
export const surfaceTokens = {
  subtle: neutral[50],
  alt: neutral[100],
  border: neutral[200],
  successBg: "#EAF5EE",
  warningBg: "#FFF4E5",
  dangerBg: "#FCECEC",
};

/**
 * Semantic accent pairs for icon tiles, small badges and status dots
 * (`theme.tokens.accent`). fg is for glyphs/text (>=4.5:1 on its own bg),
 * bg is a very light tint. The page itself stays white — these are accents only.
 *   navy   primary actions / selected          green  success, completed, normal
 *   red    critical, allergy, rejected         orange pending, warning, follow-up
 *   purple clinical records, prescriptions     teal   vitals, diagnostics
 *   amber  notifications, reminders            grey   inactive, historical
 */
export const semanticAccents = {
  navy: { fg: "#102B5C", bg: "#EDF0F5" },
  green: { fg: "#198754", bg: "#EAF5EE" },
  red: { fg: "#DC3545", bg: "#FCECEC" },
  orange: { fg: "#B8620A", bg: "#FFF4E5" },
  purple: { fg: "#8064C8", bg: "#F3EEFB" },
  teal: { fg: "#0F766E", bg: "#E6F4F2" },
  amber: { fg: "#A16207", bg: "#FEF6DC" },
  grey: { fg: "#667085", bg: "#F0F1F2" },
};

/**
 * Full-card pastel surfaces (IHS 2026-11 colorful refresh). Unlike `accent`
 * (a small icon tile), these paint the WHOLE card: tinted background, matching
 * border, icon/accent foreground and a darker heading. Use one tone per card
 * and keep the tone tied to meaning.
 */
export type CardTone = "green" | "red" | "orange" | "purple" | "teal" | "gray" | "blue";

export interface CardToneStyle {
  /** Card background. */
  bg: string;
  /** Card border. */
  border: string;
  /** Icon, small accent text and secondary label. */
  fg: string;
  /** Card heading / primary value. */
  heading: string;
}

export const CARD_TONES: Record<CardTone, CardToneStyle> = {
  green: { bg: "#E5F5E9", border: "#B8E3C5", fg: "#16834A", heading: "#12643B" },
  red: { bg: "#FDEAEA", border: "#F5C1C1", fg: "#D93636", heading: "#B42323" },
  orange: { bg: "#FFF0DD", border: "#F7D5A8", fg: "#D97706", heading: "#A95305" },
  purple: { bg: "#F0EAFE", border: "#D9C8FA", fg: "#7543C6", heading: "#5933A3" },
  teal: { bg: "#E3F4F1", border: "#B8E4DC", fg: "#138477", heading: "#08675B" },
  gray: { bg: "#F3F4F6", border: "#E5E7EB", fg: "#596579", heading: "#344054" },
  blue: { bg: "#EAF0FA", border: "#C9D8F0", fg: "#2F5FA8", heading: "#1F4480" },
};

/**
 * Deep medical-green sidebar (IHS 2026-11 redesign). `sidebarSurfaceSx` is
 * spread onto the navigation root of every DashboardShell: it recolours the
 * existing list items, icons, avatar, dividers and captions without touching
 * routes or permissions. The `&&` doubles specificity so it wins over per-item
 * sx — including the semantic NavIcon colours, which are forced to the item's
 * own colour (white when idle, deep green on the white active pill).
 */
export const SIDEBAR_BG = "#075B4C";
export const SIDEBAR_ACTIVE_BG = "#FFFFFF";
export const SIDEBAR_ACTIVE_TEXT = "#075B4C";
export const sidebarSurfaceSx = {
  bgcolor: SIDEBAR_BG,
  color: "#FFFFFF",
  "& .MuiDivider-root": { borderColor: "rgba(255,255,255,0.16)" },
  "&& .MuiTypography-root": { color: "inherit" },
  "&& .MuiTypography-caption": { color: "rgba(255,255,255,0.72)" },
  "&& .MuiListItemButton-root": {
    color: "rgba(255,255,255,0.82)",
    "&:hover": { bgcolor: "rgba(255,255,255,0.10)", color: "#FFFFFF" },
    "&.Mui-selected": { bgcolor: SIDEBAR_ACTIVE_BG, color: SIDEBAR_ACTIVE_TEXT, boxShadow: "0 1px 2px rgba(0,0,0,0.18)" },
    "&.Mui-selected:hover": { bgcolor: "#F1F8F5", color: SIDEBAR_ACTIVE_TEXT },
  },
  "&& .MuiListItemButton-root.Mui-selected .MuiTypography-caption": { color: "rgba(7,91,76,0.72)" },
  "&& .MuiListItemButton-root .MuiListItemIcon-root, && .MuiListItemButton-root .MuiListItemIcon-root *": { color: "inherit" },
  "&& .MuiAvatar-root": { bgcolor: "#FFFFFF", color: SIDEBAR_BG },
  "&& .MuiIconButton-root": { color: "rgba(255,255,255,0.85)" },
} as const;
