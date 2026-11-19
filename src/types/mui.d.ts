/**
 * MUI theme module augmentation.
 *
 * Adds a strongly-typed `theme.tokens` bag for design values that don't map
 * onto MUI's built-in slots (palette / typography / shadows already cover
 * colors, type scale and elevation).
 */
import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface DesignTokens {
    /** Border-radius scale (px). */
    radius: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      pill: number;
    };
    /** Animation duration presets (ms). */
    duration: {
      instant: number;
      fast: number;
      normal: number;
      slow: number;
    };
    /** Fixed layout dimensions (px). */
    layout: {
      navbarHeight: number;
      contentMaxWidth: number;
      containerPaddingX: number;
    };
    /** Neutral surfaces and status tints (light-mode hex). */
    surface: {
      subtle: string;
      alt: string;
      border: string;
      successBg: string;
      warningBg: string;
      dangerBg: string;
    };
    /** Semantic accent pairs for icon tiles / badges (fg glyph + light bg). */
    accent: Record<"navy" | "green" | "red" | "orange" | "purple" | "teal" | "amber" | "grey", { fg: string; bg: string }>;
    /** Named spacing steps, in theme.spacing() units. */
    space: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      section: number;
    };
  }

  interface Theme {
    tokens: DesignTokens;
  }
  interface ThemeOptions {
    tokens?: DesignTokens;
  }
}
