import type { DesignTokens, SxProps, Theme } from "@mui/material/styles";
import { semanticAccents, surfaceTokens } from "./palette";

/**
 * Design tokens surfaced on `theme.tokens` (see types/mui.d.ts for the shape).
 * These cover values MUI has no first-class slot for: radius scale, animation
 * duration presets, gradients and fixed app-shell dimensions.
 */
export const designTokens: DesignTokens = {
  // IHS radius scale — soft but never pill-shaped. Semantic map:
  // xs→small badges (6), sm→chips/tooltips/small tiles (8), md→buttons &
  // inputs (10), lg→panels/tables/menus (12), xl→cards (14), xxl→dialogs (16).
  // `pill` is only for genuinely round things (avatars, dots, progress bars).
  radius: { xs: 6, sm: 8, md: 10, lg: 12, xl: 14, xxl: 16, pill: 999 },
  duration: { instant: 100, fast: 180, normal: 260, slow: 400 },
  // Container width is capped at 1440px per the single-layout spec.
  layout: { navbarHeight: 64, contentMaxWidth: 1440, containerPaddingX: 24 },
  // Neutral surfaces + status tints (see palette.ts). Light-mode values.
  surface: surfaceTokens,
  // Semantic icon-tile / badge accents (fg + light bg pairs).
  accent: semanticAccents,
  // 4px-based spacing steps, in theme.spacing() units: use these names when a
  // gap is a layout decision (page sections, card padding), not a one-off.
  space: { xs: 0.5, sm: 1, md: 1.5, lg: 2, xl: 3, section: 3 },
};

/**
 * Global CSS-in-JS baseline applied via <GlobalStyles> — this is what lets us
 * ship zero .css files. Handles resets MUI's CssBaseline doesn't, plus themed
 * scrollbars and the anchor reset.
 */
export const globalStyles = (theme: Theme) => ({
  "html, body, #__next": { height: "100%" },
  html: { scrollBehavior: "smooth" },
  body: {
    minHeight: "100%",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
    /*
     * `clip`, not `hidden`. Both stop a stray wide child from scrolling the
     * whole page sideways, but `hidden` turns the body into a scroll container
     * and silently kills every `position: sticky` header inside it — of which
     * this app has several. `clip` clips without creating that container, so
     * sticky keeps working.
     *
     * A SAFETY NET, not a licence to overflow: a genuinely wide thing — a
     * table, a flowsheet — still needs its own `overflow-x: auto` wrapper, or
     * clipping hides its right-hand columns instead of letting them scroll.
     */
    overflowX: "clip",
  },
  a: { color: "inherit", textDecoration: "none" },


  /* Media never pushes a phone wider than itself. */
  "img, video, canvas, svg, iframe": { maxWidth: "100%" },

  /* An email address or a URL is one unbreakable word, and one of them is
   * enough to widen a card past the viewport. Scoped to text-bearing elements
   * so it can't affect layout containers. */
  "p, h1, h2, h3, h4, h5, h6, li, dd, dt, td, th, figcaption": {
    overflowWrap: "anywhere",
  },
  // Highlight selection in the calm accent tint.
  "::selection": {
    backgroundColor: (theme.vars ?? theme).palette.primary.main,
    color: (theme.vars ?? theme).palette.primary.contrastText,
  },
  // Accessible, consistent keyboard focus ring (WCAG AA) — only for keyboard users.
  ":focus-visible": {
    outline: `2px solid ${(theme.vars ?? theme).palette.primary.main}`,
    outlineOffset: 2,
  },
  // Respect reduced-motion preferences.
  "@media (prefers-reduced-motion: reduce)": {
    "*, *::before, *::after": {
      animationDuration: "0.01ms !important",
      animationIterationCount: "1 !important",
      transitionDuration: "0.01ms !important",
      scrollBehavior: "auto !important",
    },
  },
  "*::-webkit-scrollbar": { width: 10, height: 10 },
  "*::-webkit-scrollbar-track": { background: "transparent" },
  "*::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.divider,
    borderRadius: theme.tokens.radius.pill,
    border: "2px solid transparent",
    backgroundClip: "content-box",
  },
  "*::-webkit-scrollbar-thumb:hover": {
    backgroundColor: theme.palette.text.disabled,
  },
});

/* ------------------------------------------------------------------ *
 * Reusable `sx` primitives. Import these instead of re-typing layout
 * boilerplate; compose with the spread operator or sx arrays.
 * ------------------------------------------------------------------ */

export const flexCenter: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const flexBetween: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export const flexColumn: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
};

export const absoluteFill: SxProps<Theme> = {
  position: "absolute",
  inset: 0,
};

/** Single-line ellipsis. */
export const truncate: SxProps<Theme> = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/** Multi-line clamp. */
export const lineClamp = (lines: number): SxProps<Theme> => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

/** Accessible visually-hidden (for icon-only controls, skip links). */
export const visuallyHidden: SxProps<Theme> = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * Hover state for a clickable card: the border darkens a step and a very soft
 * shadow appears. No lift, no coloured glow.
 */
export const cardHover: SxProps<Theme> = {
  transition: (t) => t.transitions.create(["box-shadow", "border-color"], { duration: t.tokens.duration.fast }),
  "&:hover": {
    boxShadow: 1,
    borderColor: (t) => t.palette.grey[300],
  },
};

/**
 * One-off brand accents with no MUI palette slot: a soft mint success tint
 * (used for "available now" / success-tinted badges) and the star-rating gold.
 */
export const accentTokens = {
  tealTint: { bg: "#E7F7EF", border: "#C7EBD8" },
  starGold: "#F4B400",
};
