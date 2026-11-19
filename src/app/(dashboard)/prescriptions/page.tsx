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
import { useEffect, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { EmptyState } from "@/components/feedback/EmptyState";
import { DateRangeFilter, type DateRange } from "@/components/forms/DateRangeFilter";
import { Loading } from "@/components/feedback/Loading";
import { Pagination } from "@/components/ui/Pagination";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import apiClient from "@/utils/apiClient";
import { API_ENDPOINTS } from "@/config/api";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "sonner";

interface PrescriptionRequest {
  id: number;
  patientId: number;
  providerId: number;
  providerType: string;
  fileUrl: string;
  fileName: string;
  notes: string | null;
  status: string;
  patient?: { id: number; name: string; phone: string };
  createdAt: string;
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Viewed", value: "viewed" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

const STATUS_OPTIONS: Record<string, string[]> = {
  pending: ["viewed", "processing", "rejected"],
  viewed: ["processing", "rejected"],
  processing: ["completed", "rejected"],
};

const statusColor = (status: string) => {
  const map: Record<string, "warning" | "info" | "primary" | "success" | "error" | "default"> = {
    pending: "warning",
    viewed: "info",
    processing: "primary",
    completed: "success",
    rejected: "error",
  };
  return map[status] ?? "default";
};

export default function PrescriptionsPage() {
  const [requests, setRequests] = useState<PrescriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (statusFilter) params.status = statusFilter;
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;
      const { data } = await apiClient.get(API_ENDPOINTS.PROVIDER_PRESCRIPTION_REQUESTS, { params });
      const result = data.data;
      setRequests(result.requests || []);
      setTotalPages(result.totalPages || 1);
    } catch {
      toast.error("Failed to load prescription requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, dateRange]);

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    setUpdatingId(requestId);
    try {
      await apiClient.put(API_ENDPOINTS.PRESCRIPTION_REQUEST_STATUS(requestId), { status: newStatus });
      toast.success(`Request ${newStatus}`);
      fetchRequests();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update status"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Stack spacing={3}>
      <PageTitle title="Prescription Requests" subtitle="View and process patient prescriptions" />

      <Tabs
        value={STATUS_TABS.findIndex((t) => t.value === statusFilter)}
        onChange={(_, i) => { setStatusFilter(STATUS_TABS[i].value); setPage(1); }}
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
          setDateRange(range);
          setPage(1);
        }}
      />

      {loading ? (
        <Loading label="Loading prescription requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="FiFileText"
          title="No prescription requests"
          description={
            statusFilter || dateRange.from || dateRange.to
              ? "No requests match these filters"
              : "Prescription requests from patients will appear here"
          }
        />
      ) : (
        <>
          {/* Compact grid: 1 column on phones, 2 on tablets, 3 on desktop. */}
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
                  {/* Request date first (top-left), status top-right, so requests scan by day. */}
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
                    <Chip label={req.status} color={statusColor(req.status)} size="small" sx={{ textTransform: "capitalize", flexShrink: 0 }} />
                  </Stack>

                  <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Prescription #{req.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap title={req.patient?.name || "N/A"}>
                      Patient: {req.patient?.name || "N/A"} {req.patient?.phone ? `(${req.patient.phone})` : ""}
                    </Typography>
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

                  <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      href={ROUTES.PRESCRIPTION_DETAIL(req.id)}
                      sx={{ flexGrow: 1 }}
                    >
                      View & Check Availability
                    </Button>
                    {STATUS_OPTIONS[req.status] && (
                      STATUS_OPTIONS[req.status].map((nextStatus) => (
                        <Button
                          key={nextStatus}
                          size="small"
                          variant={nextStatus === "rejected" ? "outlined" : "contained"}
                          color={nextStatus === "rejected" ? "error" : "primary"}
                          disabled={updatingId === req.id}
                          onClick={() => handleStatusUpdate(req.id, nextStatus)}
                          sx={{ textTransform: "capitalize" }}
                        >
                          {updatingId === req.id ? "..." : nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                        </Button>
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Pagination count={totalPages} page={page} onChange={setPage} />
        </>
      )}
    </Stack>
  );
}
