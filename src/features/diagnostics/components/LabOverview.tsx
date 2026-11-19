"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { format } from "date-fns";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { StatisticCard, type StatisticCardProps } from "@/components/cards/StatisticCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { ROUTES } from "@/constants/routes";
import { roleLabel } from "@/features/dashboard/nav";
import { useAuth } from "@/hooks/useAuth";
import { diagnosticService } from "@/services/diagnostic.service";
import type { DiagnosticRequest, DiagnosticSummary } from "@/types";
import { diagnosticStatusColor, diagnosticStatusLabel } from "../status";

/** Overview for a Diagnostic Lab Center: request counts by status + the latest requests. */
export function LabOverview() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DiagnosticSummary | null>(null);
  const [recent, setRecent] = useState<DiagnosticRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([diagnosticService.getSummary(), diagnosticService.getIncoming({ page: 1, limit: 5 })])
      .then(([summaryRes, recentRes]) => {
        if (cancelled) return;
        if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
        else setError(true);
        if (recentRes.status === "fulfilled") setRecent(recentRes.value.requests || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) return <Loading label="Loading statistics..." />;

  const count = (status: keyof DiagnosticSummary["byStatus"]) => summary?.byStatus?.[status] ?? 0;
  const cards: StatisticCardProps[] = [
    { icon: "FiClipboard", value: summary?.total ?? 0, label: "Total requests", color: "primary" },
    { icon: "FiClock", value: count("pending"), label: "Pending", color: "warning" },
    { icon: "FiCalendar", value: count("booking_requested"), label: "Bookings to confirm", color: "secondary" },
    { icon: "FiCheckCircle", value: count("confirmed"), label: "Confirmed", color: "success" },
    { icon: "FiFileText", value: count("report_ready"), label: "Reports ready", color: "info" },
    { icon: "FiActivity", value: summary?.tests ?? 0, label: "Tests in catalogue", color: "primary" },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Welcome back, {user?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {user ? roleLabel[user.role] : "Diagnostic Lab Center"} Dashboard
        </Typography>
      </Box>

      {error ? (
        <ErrorState
          description="We couldn't load your request statistics."
          onRetry={() => {
            setError(false);
            setLoading(true);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : (
        <Grid container spacing={2.5}>
          {cards.map((card) => (
            <Grid key={card.label} size={{ xs: 6, md: 4 }}>
              <Paper variant="outlined" sx={{ height: "100%" }}>
                <StatisticCard {...card} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Recent requests
            </Typography>
            <Button size="small" component={NextLink} href={ROUTES.DIAGNOSTICS}>
              View all
            </Button>
          </Stack>
          {recent.length === 0 ? (
            <EmptyState
              icon="FiClipboard"
              title="No requests yet"
              description="Prescriptions patients share with your lab will appear here"
              sx={{ py: 3 }}
            />
          ) : (
            <Stack spacing={1}>
              {recent.map((req) => (
                <Stack
                  key={req.id}
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center", justifyContent: "space-between", py: 0.75, borderTop: 1, borderColor: "divider" }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      Request #{req.id} · {req.patient?.name || "N/A"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(req.createdAt), "dd MMM yyyy, h:mm a")}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                    <Chip label={diagnosticStatusLabel[req.status] ?? req.status} color={diagnosticStatusColor[req.status] ?? "default"} size="small" />
                    <Button size="small" variant="outlined" component={NextLink} href={ROUTES.DIAGNOSTIC_DETAIL(req.id)}>
                      View
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
