"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Loading } from "@/components/feedback/Loading";
import { Pagination } from "@/components/ui/Pagination";
import { PageTitle } from "@/components/typography/PageTitle";
import { notificationService } from "@/services/notification.service";
import type { MedicineNotification } from "@/types";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<MedicineNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationService.list({ page, limit: 20 });
      setNotifications(result.notifications || []);
      setTotalPages(result.totalPages || 1);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnread = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnread();
  }, [page]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <Stack spacing={3}>
      <PageTitle
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        actions={
          unreadCount > 0 ? (
            <Button onClick={handleMarkAllRead} sx={{ textTransform: "none" }}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <Loading label="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="FiBell"
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              variant="outlined"
              sx={{
                cursor: notif.isRead ? "default" : "pointer",
                borderColor: notif.isRead ? "divider" : "info.main",
                "&:hover": notif.isRead ? undefined : { borderColor: "info.dark" },
                transition: (t) => t.transitions.create(["border-color", "box-shadow"]),
              }}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
            >
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: notif.isRead ? 400 : 700 }}
                      >
                        {notif.title}
                      </Typography>
                      {!notif.isRead && (
                        <Chip
                          label="New"
                          size="small"
                          color="info"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(notif.createdAt).toLocaleString()}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Pagination count={totalPages} page={page} onChange={setPage} />
    </Stack>
  );
}
