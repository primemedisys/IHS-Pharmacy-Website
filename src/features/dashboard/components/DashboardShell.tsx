"use client";

import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { FiLogOut, FiMenu } from "react-icons/fi";
import { NavIcon } from "@/components/common/AccentTile";
import { Loading } from "@/components/feedback/Loading";
import { Logo } from "@/components/common/Logo";
import { SIDEBAR_BG, sidebarSurfaceSx } from "@/theme/palette";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/utils/format";
import { canAccessRoute, dashboardNavForRole, roleLabel } from "../nav";

const DRAWER_WIDTH = 264;

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace(ROUTES.LOGIN);
  }, [loading, user, router]);

  // UX-only guard: a role landing on another provider type's section goes to the overview.
  const forbidden = !!user && !canAccessRoute(user.role, pathname);
  useEffect(() => {
    if (forbidden) router.replace(ROUTES.DASHBOARD);
  }, [forbidden, router]);

  if (loading || !user || forbidden) return <Loading fullScreen label="Loading your dashboard..." />;

  const nav = dashboardNavForRole(user.role);
  const matches = (href: string) => (href === ROUTES.DASHBOARD ? pathname === href : pathname.startsWith(href));
  // The longest matching href wins, so a nested item (e.g. /diagnostics/tests)
  // doesn't also highlight its parent (/diagnostics).
  const activeHref = nav
    .filter((n) => matches(n.href))
    .reduce<string | undefined>((best, n) => (!best || n.href.length > best.length ? n.href : best), undefined);
  const active = (href: string) => href === activeHref;
  const pageTitle = nav.find((n) => active(n.href))?.label ?? "Dashboard";

  const drawerContent = (
    <Stack
      sx={{
        height: "100%",
        ...sidebarSurfaceSx,
        "& .MuiDivider-root": { borderColor: "divider" },
      }}
    >
      <Toolbar sx={{ px: 2.5 }}>
        <Logo />
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 1.5, flexGrow: 1, overflowY: "auto" }} onClick={() => setMobileOpen(false)}>
        {nav.map((item, index) => {
          const isActive = active(item.href);
          const heading = item.section && item.section !== nav[index - 1]?.section ? item.section : null;
          return (
            <Fragment key={item.href}>
            {heading && (
              <Typography
                variant="overline"
                component="div"
                sx={{ px: 1.5, pt: 1.5, pb: 0.25, color: "text.secondary", fontWeight: 700, lineHeight: 1.6, letterSpacing: 1 }}
              >
                {heading}
              </Typography>
            )}
            <ListItemButton
              component={Link}
              href={item.href}
              selected={isActive}
              sx={{
                borderRadius: (t) => `${t.tokens.radius.sm}px`,
                mb: 0.5,
                color: isActive ? "primary.main" : "text.secondary",
                "&:hover": { bgcolor: "action.hover", color: "text.primary" },
                "&.Mui-selected": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.main" },
                "&.Mui-selected:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.12) },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
                <NavIcon name={item.icon} size={19} />
              </ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: isActive ? 700 : 500, fontSize: 14 } } }} />
            </ListItemButton>
            </Fragment>
          );
        })}
      </List>
      <Divider />
      <Stack direction="row" spacing={1.5} sx={{ p: 2, alignItems: "center" }}>
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 38, height: 38, fontSize: 14, fontWeight: 700 }}>
          {getInitials(user.name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>{user.name}</Typography>
          <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>{roleLabel[user.role]}</Typography>
        </Box>
      </Stack>
    </Stack>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { md: "none" }, color: "text.primary" }} aria-label="Open menu">
            <FiMenu />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {pageTitle}
          </Typography>
          <Chip label={roleLabel[user.role]} size="small" variant="outlined" sx={{ display: { xs: "none", sm: "flex" }, fontWeight: 600 }} />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Account" sx={{ p: 0.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 34, height: 34, fontSize: 13, fontWeight: 700 }}>
              {getInitials(user.name)}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" noWrap>{user.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); void logout(); }}>
              <ListItemIcon><FiLogOut /></ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", borderRadius: 0, bgcolor: SIDEBAR_BG, borderColor: SIDEBAR_BG } }}>
          {drawerContent}
        </Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", borderRadius: 0, bgcolor: SIDEBAR_BG, borderColor: SIDEBAR_BG } }}>
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar aria-hidden />
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
