import { alpha, type Components, type Theme } from "@mui/material/styles";

type Tone = "success" | "warning" | "error" | "info";
const TONES: Tone[] = ["success", "warning", "error", "info"];

/**
 * A status tone as a SOFT block: tinted background + strong coloured text,
 * instead of a saturated fill. Used by status chips and standard alerts so
 * colour carries meaning without making the interface loud. `info` is neutral
 * grey (no light-blue boxes).
 */
function soft(theme: Theme, tone: Tone) {
  const p = (theme.vars ?? theme).palette;
  const bg = {
    success: theme.tokens.surface.successBg,
    warning: theme.tokens.surface.warningBg,
    error: theme.tokens.surface.dangerBg,
    info: theme.tokens.surface.subtle,
  }[tone];
  const ink = { success: p.success.dark, warning: p.warning.dark, error: p.error.main, info: p.text.primary }[tone];
  return {
    backgroundColor: bg,
    color: ink,
    ...theme.applyStyles("dark", {
      backgroundColor: alpha(theme.palette[tone].main, 0.16),
      color: (theme.vars ?? theme).palette[tone].light,
    }),
  };
}

/**
 * Global component overrides — the IHS design-system enforcement layer.
 * Every override uses the callback form `({ theme }) => ...` so tokens/palette
 * stay dynamic across light & dark schemes (no hardcoded colors anywhere).
 *
 * Radius map (theme.tokens.radius): chips → sm (8), buttons & inputs → md (10),
 * panels, tables & menus → lg (12), cards → xl (14), dialogs → xxl (16).
 * Elevation is limited to the two very-soft levels from theme/shadows.
 * Density: cards pad 16px (20px from md), table rows ~40px, tabs 40px.
 */
export const components: Components<Omit<Theme, "components">> = {
  MuiCssBaseline: {
    styleOverrides: {
      "#nprogress .bar": { zIndex: 2000 },
    },
  },

  MuiContainer: {
    styleOverrides: {
      maxWidthXl: ({ theme }) => ({
        maxWidth: `${theme.tokens.layout.contentMaxWidth}px`,
      }),
    },
  },

  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.tokens.radius.sm,
        paddingInline: theme.spacing(2),
        paddingBlock: theme.spacing(0.875),
        minHeight: 38,
        fontWeight: 600,
        transition: theme.transitions.create(
          ["background-color", "box-shadow", "border-color", "color"],
          { duration: theme.tokens.duration.fast },
        ),
      }),
      sizeSmall: ({ theme }) => ({ paddingBlock: theme.spacing(0.5), paddingInline: theme.spacing(1.5), minHeight: 32, borderRadius: theme.tokens.radius.sm }),
      sizeLarge: ({ theme }) => ({ paddingBlock: theme.spacing(1.25), paddingInline: theme.spacing(3), minHeight: 46, fontSize: "0.95rem" }),
      contained: {
        boxShadow: "none",
        "&:hover": { boxShadow: "none" },
      },
      // Secondary buttons: white with a subtle grey border; the hover tints
      // the surface instead of darkening the outline.
      // A plain secondary action reads in ink, not navy — navy is for the
      // primary action. Coloured outlines (error, success) keep their colour.
      outlined: ({ theme, ownerState }) => ({
        borderColor: (theme.vars ?? theme).palette.grey[300],
        backgroundColor: (theme.vars ?? theme).palette.background.paper,
        ...((ownerState.color ?? "primary") === "primary" && { color: (theme.vars ?? theme).palette.text.primary }),
        "&:hover": {
          borderColor: (theme.vars ?? theme).palette.grey[400],
          backgroundColor: (theme.vars ?? theme).palette.grey[50],
        },
      }),
    },
  },

  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.tokens.radius.md,
        transition: theme.transitions.create(["background-color", "color"], { duration: theme.tokens.duration.fast }),
      }),
    },
  },

  MuiTextField: {
    defaultProps: { variant: "outlined", size: "small", fullWidth: true },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.tokens.radius.sm,
        backgroundColor: (theme.vars ?? theme).palette.background.paper,
        transition: theme.transitions.create(["border-color", "box-shadow"], { duration: theme.tokens.duration.fast }),
        // A clearly visible resting border (a notch stronger than the hairline
        // divider) so inputs read as interactive, and a soft blue focus ring.
        "& .MuiOutlinedInput-notchedOutline": { borderColor: (theme.vars ?? theme).palette.grey[300] },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: (theme.vars ?? theme).palette.grey[400],
        },
        "&.Mui-focused": {
          boxShadow: `0 0 0 3px ${theme.vars ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.14)` : alpha(theme.palette.primary.main, 0.14)}`,
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderWidth: 1,
          borderColor: (theme.vars ?? theme).palette.primary.main,
        },
        "&.Mui-error.Mui-focused": { boxShadow: "none" },
      }),
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: { fontWeight: 500 },
    },
  },

  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundImage: "none",
        borderRadius: theme.tokens.radius.lg,
      }),
      outlined: ({ theme }) => ({ borderColor: theme.tokens.surface.border, ...theme.applyStyles("dark", { borderColor: (theme.vars ?? theme).palette.divider }) }),
    },
  },

  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: theme.tokens.radius.lg,
        border: `1px solid ${(theme.vars ?? theme).palette.divider}`,
        boxShadow: theme.shadows[6],
        marginTop: theme.spacing(0.5),
      }),
      list: ({ theme }) => ({ padding: theme.spacing(0.75) }),
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.tokens.radius.sm,
        marginBlock: 2,
        paddingBlock: theme.spacing(0.75),
      }),
    },
  },

  MuiPopover: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: theme.tokens.radius.lg,
        border: `1px solid ${(theme.vars ?? theme).palette.divider}`,
        boxShadow: theme.shadows[6],
      }),
    },
  },

  MuiCard: {
    defaultProps: { elevation: 0, variant: "outlined" },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.tokens.radius.xxl,
        border: `1px solid ${theme.tokens.surface.border}`,
        backgroundColor: (theme.vars ?? theme).palette.background.paper,
        ...theme.applyStyles("dark", { borderColor: (theme.vars ?? theme).palette.divider }),
      }),
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(2),
        "&:last-child": { paddingBottom: theme.spacing(2) },
        [theme.breakpoints.up("md")]: {
          padding: theme.spacing(2.5),
          "&:last-child": { paddingBottom: theme.spacing(2.5) },
        },
      }),
    },
  },

  MuiCardHeader: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: theme.spacing(2, 2, 0.5),
        [theme.breakpoints.up("md")]: { padding: theme.spacing(2.5, 2.5, 0.5) },
      }),
      title: ({ theme }) => ({ fontSize: theme.typography.h6.fontSize, fontWeight: 600 }),
      subheader: ({ theme }) => ({ color: (theme.vars ?? theme).palette.text.secondary }),
    },
  },

  MuiDialog: {
    defaultProps: { fullWidth: true, maxWidth: "sm" },
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: theme.tokens.radius.xxl,
        padding: theme.spacing(1),
        boxShadow: theme.shadows[8],
        /*
         * PHONES: no dialog may be wider or taller than the screen.
         *
         * Done here rather than per dialog because there are ~40 of them across
         * the app and `fullScreen` is a boolean each one has to remember — a
         * rule the next dialog someone writes would silently miss. MUI's own
         * default (32px margin, maxHeight 'calc(100% - 64px)') is fine until a
         * dialog sets its own maxWidth or a fixed width, which several do; this
         * clamps all of them.
         *
         * Deliberately NOT height:100% — a two-line confirm filling a phone
         * screen reads as an error page. Small dialogs stay small.
         */
        [theme.breakpoints.down("sm")]: {
          margin: theme.spacing(1.5),
          width: "calc(100% - 24px)",
          maxWidth: "calc(100% - 24px)",
          maxHeight: "calc(100% - 24px)",
          padding: theme.spacing(0.5),
          borderRadius: theme.tokens.radius.xl,
        },
      }),
    },
  },

  /* Long dialog bodies scroll instead of pushing the actions off a phone. */
  MuiDialogContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        [theme.breakpoints.down("sm")]: {
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
        },
      }),
    },
  },

  /* Stacked, full-width buttons on a phone — a row of three overflows. */
  MuiDialogActions: {
    styleOverrides: {
      root: ({ theme }) => ({
        [theme.breakpoints.down("sm")]: {
          flexWrap: "wrap",
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
        },
      }),
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: ({ theme }) => ({ fontWeight: 600, fontSize: theme.typography.h5.fontSize }),
    },
  },

  MuiAppBar: {
    defaultProps: { elevation: 0, color: "inherit" },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: (theme.vars ?? theme).palette.background.paper,
        borderBottom: `1px solid ${(theme.vars ?? theme).palette.divider}`,
      }),
    },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRight: `1px solid ${(theme.vars ?? theme).palette.divider}`,
        backgroundColor: (theme.vars ?? theme).palette.background.paper,
      }),
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.tokens.radius.sm,
        transition: theme.transitions.create(["background-color", "color"], { duration: theme.tokens.duration.fast }),
        "&.Mui-selected": {
          color: (theme.vars ?? theme).palette.primary.main,
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`
            : alpha(theme.palette.primary.main, 0.08),
        },
      }),
    },
  },

  MuiChip: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        borderRadius: theme.tokens.radius.sm,
        fontWeight: 500,
        // Filled status chips are soft (tint + coloured text), not solid fills.
        ...(ownerState.variant !== "outlined" &&
          TONES.includes(ownerState.color as Tone) && {
            ...soft(theme, ownerState.color as Tone),
            fontWeight: 600,
            "& .MuiChip-icon, & .MuiChip-deleteIcon": { color: "inherit" },
            "&.MuiChip-clickable:hover": { filter: "brightness(0.97)" },
          }),
      }),
      sizeSmall: ({ theme }) => ({ borderRadius: theme.tokens.radius.xs }),
      outlined: ({ theme }) => ({ borderColor: (theme.vars ?? theme).palette.divider }),
    },
  },

  /* Segmented filters (e.g. Pending / Completed): the selected option takes
     its own colour — `color="warning"` reads orange, `"success"` green. */
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        textTransform: "none",
        fontWeight: 600,
        paddingBlock: theme.spacing(0.5),
        paddingInline: theme.spacing(1.5),
      }),
    },
  },

  MuiTooltip: {
    defaultProps: { arrow: true },
    styleOverrides: {
      tooltip: ({ theme }) => ({
        borderRadius: theme.tokens.radius.sm,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 500,
        paddingBlock: theme.spacing(0.75),
        paddingInline: theme.spacing(1.25),
      }),
    },
  },

  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        textTransform: "none",
        fontWeight: 600,
        minHeight: 40,
        borderRadius: theme.tokens.radius.sm,
      }),
    },
  },

  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 40 },
      indicator: ({ theme }) => ({ height: 2, borderRadius: theme.tokens.radius.pill }),
    },
  },

  MuiTableContainer: {
    styleOverrides: {
      root: ({ theme }) => ({ borderRadius: theme.tokens.radius.lg }),
    },
  },

  MuiTableRow: {
    styleOverrides: {
      root: ({ theme }) => ({
        "&.MuiTableRow-hover:hover": { backgroundColor: theme.tokens.surface.subtle, ...theme.applyStyles("dark", { backgroundColor: (theme.vars ?? theme).palette.action.hover }) },
      }),
    },
  },

  MuiTableCell: {
    styleOverrides: {
      // Compact rows (~40px) so a table shows more on one screen.
      root: ({ theme }) => ({
        borderBottomColor: (theme.vars ?? theme).palette.divider,
        paddingBlock: theme.spacing(1.125),
        paddingInline: theme.spacing(1.5),
      }),
      sizeSmall: ({ theme }) => ({ paddingBlock: theme.spacing(0.75), paddingInline: theme.spacing(1.25) }),
      // Header row on the light grey surface with slate labels — calm, and
      // tables still don't read as white-on-white.
      head: ({ theme }) => ({
        fontWeight: 600,
        fontSize: theme.typography.caption.fontSize,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        color: (theme.vars ?? theme).palette.text.secondary,
        backgroundColor: (theme.vars ?? theme).palette.grey[50],
      }),
    },
  },

  MuiAlert: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        borderRadius: theme.tokens.radius.md,
        fontWeight: 500,
        ...(ownerState.variant !== "filled" &&
          ownerState.variant !== "outlined" && {
            ...soft(theme, (ownerState.severity ?? "success") as Tone),
            border: `1px solid ${theme.tokens.surface.border}`,
            "& .MuiAlert-icon": { color: "inherit", opacity: 0.9 },
            "& .MuiAlert-message": { color: (theme.vars ?? theme).palette.text.primary },
            ...theme.applyStyles("dark", { borderColor: (theme.vars ?? theme).palette.divider }),
          }),
      }),
    },
  },

  MuiLinearProgress: {
    styleOverrides: {
      root: ({ theme }) => ({ borderRadius: theme.tokens.radius.pill, height: 8 }),
      bar: ({ theme }) => ({ borderRadius: theme.tokens.radius.pill }),
    },
  },

  MuiLink: {
    defaultProps: { underline: "hover" },
    styleOverrides: {
      root: { fontWeight: 500 },
    },
  },
};
