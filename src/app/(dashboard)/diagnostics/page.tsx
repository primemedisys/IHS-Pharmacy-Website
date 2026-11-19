"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { format } from "date-fns";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { DateRangeFilter, type DateRange } from "@/components/forms/DateRangeFilter";
import { Loading } from "@/components/feedback/Loading";
import { Pagination } from "@/components/ui/Pagination";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { DIAGNOSTIC_STATUSES, diagnosticStatusColor, diagnosticStatusLabel } from "@/features/diagnostics/status";
import { diagnosticService } from "@/services/diagnostic.service";
import type { DiagnosticRequest } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDay } from "@/utils/format";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  ...DIAGNOSTIC_STATUSES.map((s) => ({ label: diagnosticStatusLabel[s], value: s })),
];

export default function DiagnosticRequestsPage() {
  const [requests, setRequests] = useState<DiagnosticRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({});

  // Loading is switched on by the handlers that change the query (not in the effect).
  useEffect(() => {
    let cancelled = false;
    diagnosticService
      .getIncoming({
        page,
        limit: 12,
        status: statusFilter || undefined,
        from: dateRange.from,
        to: dateRange.to,
      })
      .then((result) => {
        if (cancelled) return;
        setRequests(result.requests || []);
        setTotalPages(result.totalPages || 1);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getApiErrorMessage(err, "Failed to load diagnostic requests"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, dateRange]);

  return (
    <Stack spacing={3}>
      <PageTitle title="Diagnostic Requests" subtitle="Prescriptions patients shared with your lab — answer tests, confirm bookings and upload reports" />

      <Tabs
        value={STATUS_TABS.findIndex((t) => t.value === statusFilter)}
        onChange={(_, i) => { setLoading(true); setStatusFilter(STATUS_TABS[i].value); setPage(1); }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 40 }}
      >
        {STATUS_TABS.map((tab) => (
          <Tab key={tab.value} label={tab.label} sx={{ minHeight: 40, textTransform: "none" }} />
        ))}
      </Tabs>

      <DateRangeFilter
        onChange={(range) => {
          setLoading(true);
          setDateRange(range);
          setPage(1);
        }}
      />

      {loading ? (
        <Loading label="Loading diagnostic requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="FiClipboard"
          title="No diagnostic requests"
          description={
            statusFilter || dateRange.from || dateRange.to
              ? "No requests match these filters"
              : "Prescriptions patients share with your lab will appear here"
          }
        />
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            {requests.map((req) => (
              <Card key={req.id} variant="outlined" sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: 1.25, "&:last-child": { pb: 2 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary", minWidth: 0 }}>
                      <FiCalendar size={14} style={{ flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }} noWrap>
                        {format(new Date(req.createdAt), "dd MMM yyyy")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {format(new Date(req.createdAt), "h:mm a")}
                      </Typography>
                    </Stack>
                    <Chip
                      label={diagnosticStatusLabel[req.status] ?? req.status}
                      color={diagnosticStatusColor[req.status] ?? "default"}
                      size="small"
                      sx={{ flexShrink: 0 }}
                    />
                  </Stack>

                  <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Request #{req.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap title={req.patient?.name || "N/A"}>
                      Patient: {req.patient?.name || "N/A"} {req.patient?.phone ? `(${req.patient.phone})` : ""}
                    </Typography>
                    {req.preferredDate && (
                      <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600 }} noWrap>
                        Preferred date: {formatDay(req.preferredDate)}
                      </Typography>
                    )}
                    {req.fileName && (
                      <Typography variant="caption" color="text.secondary" noWrap title={req.fileName}>
                        File: {req.fileName}
                      </Typography>
                    )}
                    {req.notes && (
                      <Typography variant="caption" color="text.secondary" noWrap title={req.notes}>
                        Notes: {req.notes}
                      </Typography>
                    )}
                  </Stack>

                  <Button size="small" variant="outlined" component={NextLink} href={ROUTES.DIAGNOSTIC_DETAIL(req.id)}>
                    View request
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(p) => {
              if (p === page) return;
              setLoading(true);
              setPage(p);
            }}
          />
        </>
      )}
    </Stack>
  );
}
