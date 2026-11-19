"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { StatisticCard } from "@/components/cards/StatisticCard";
import { Loading } from "@/components/feedback/Loading";
import { roleLabel } from "@/features/dashboard/nav";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/utils/apiClient";

interface DashboardStats {
  totalMedicines: number;
  totalOrders: number;
  pendingOrders: number;
  unreadNotifications: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMedicines: 0,
    totalOrders: 0,
    pendingOrders: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [medicinesRes, ordersRes, notifRes] = await Promise.allSettled([
          apiClient.get("/medicine/my-medicines", { params: { limit: 1 } }),
          apiClient.get("/medicine/orders/provider-orders", { params: { limit: 1 } }),
          apiClient.get("/medicine/notifications/unread-count"),
        ]);

        setStats({
          totalMedicines:
            medicinesRes.status === "fulfilled" ? medicinesRes.value.data.data?.total || 0 : 0,
          totalOrders:
            ordersRes.status === "fulfilled" ? ordersRes.value.data.data?.total || 0 : 0,
          pendingOrders:
            ordersRes.status === "fulfilled"
              ? ordersRes.value.data.data?.orders?.filter((o: any) => o.status === "pending").length || 0
              : 0,
          unreadNotifications:
            notifRes.status === "fulfilled" ? notifRes.value.data.data?.unreadCount || 0 : 0,
        });
      } catch {
        // Stats are non-critical
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <Loading label="Loading statistics..." />;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Welcome back, {user?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {user ? roleLabel[user.role] : "Pharmacy"} Dashboard
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticCard icon="FiPackage" value={stats.totalMedicines} label="Total Medicines" color="primary" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticCard icon="FiShoppingCart" value={stats.totalOrders} label="Total Orders" color="success" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticCard icon="FiClock" value={stats.pendingOrders} label="Pending Orders" color="warning" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatisticCard icon="FiBell" value={stats.unreadNotifications} label="Unread Notifications" color="info" />
        </Grid>
      </Grid>
    </Stack>
  );
}
