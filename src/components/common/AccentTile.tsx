"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { Icon } from "./Icon";

export type AccentKey = "navy" | "green" | "red" | "orange" | "purple" | "teal" | "amber" | "grey";

/**
 * Meaning-based accent for a Feather icon name. Colour follows the IHS semantic
 * system (navy actions, green success/money, red critical, orange pending/
 * follow-up, purple clinical records, teal vitals/diagnostics, amber
 * notifications, grey neutral). Unknown icons stay navy.
 */
const ICON_ACCENT: Record<string, AccentKey> = {
  FiGrid: "navy", FiHome: "navy", FiUser: "navy", FiUsers: "navy", FiCalendar: "navy", FiMapPin: "navy",
  FiSend: "navy", FiUploadCloud: "navy", FiUpload: "navy", FiBriefcase: "navy", FiBarChart2: "navy",
  FiMessageSquare: "navy", FiVideo: "navy", FiPhone: "navy",
  FiActivity: "teal", FiPackage: "teal", FiArchive: "teal", FiLayers: "teal", FiThermometer: "teal",
  FiFileText: "purple", FiClipboard: "purple", FiHash: "purple", FiBookOpen: "purple", FiFolder: "purple",
  FiGitMerge: "purple", FiShare2: "purple", FiFile: "purple",
  FiDroplet: "red", FiTruck: "red", FiHeart: "red", FiAlertOctagon: "red", FiAlertTriangle: "red",
  FiClock: "orange", FiRepeat: "orange", FiTag: "orange", FiInbox: "orange", FiBookmark: "orange",
  FiBell: "amber", FiMail: "amber",
  FiTrendingUp: "green", FiDollarSign: "green", FiShoppingBag: "green", FiShoppingCart: "green",
  FiCreditCard: "green", FiCheckSquare: "green", FiCheckCircle: "green", FiPlusSquare: "green", FiShield: "green",
  FiSettings: "grey", FiList: "grey", FiExternalLink: "grey", FiLogIn: "grey", FiSearch: "grey",
};

export function accentForIcon(name: string): AccentKey {
  return ICON_ACCENT[name] ?? "navy";
}

/** Bare glyph in its semantic colour; turns primary when inside a selected nav item. */
export function NavIcon({ name, size = 19, accent }: { name: string; size?: number; accent?: AccentKey }) {
  const key = accent ?? accentForIcon(name);
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        color: (t) => t.tokens.accent[key].fg,
        ".Mui-selected &": { color: "primary.main" },
        ".Mui-disabled &": { color: "text.disabled" },
      }}
    >
      <Icon name={name} size={size} />
    </Box>
  );
}

/**
 * Subtle tinted square holding a meaningful glyph — the standard icon container
 * for dashboard cards, section headers and shortcut tiles.
 */
export function AccentTile({
  icon,
  accent,
  size = 36,
  iconSize,
  sx,
}: {
  icon: string;
  accent?: AccentKey;
  size?: number;
  iconSize?: number;
  sx?: SxProps<Theme>;
}) {
  const key = accent ?? accentForIcon(icon);
  return (
    <Box
      aria-hidden
      sx={[
        {
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          width: size,
          height: size,
          borderRadius: (t) => `${t.tokens.radius.md}px`,
          bgcolor: (t) => t.tokens.accent[key].bg,
          color: (t) => t.tokens.accent[key].fg,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.5)} />
    </Box>
  );
}
