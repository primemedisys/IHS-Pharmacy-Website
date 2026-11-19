"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Loading } from "@/components/feedback/Loading";
import { PageTitle } from "@/components/typography/PageTitle";
import { ROUTES } from "@/constants/routes";
import { AnswerEditor } from "@/features/diagnostics/components/AnswerEditor";
import { ReportsCard } from "@/features/diagnostics/components/ReportsCard";
import {
  ANSWERABLE_STATUSES,
  REJECTABLE_STATUSES,
  REPORT_STATUSES,
  diagnosticStatusColor,
  diagnosticStatusLabel,
} from "@/features/diagnostics/status";
import { diagnosticService, type LabStatusChange } from "@/services/diagnostic.service";
import type { DiagnosticRequest, DiagnosticTest } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency, formatDay } from "@/utils/format";

type PendingAction = "reject" | "reject_booking" | "complete" | null;

const BOOKED_STATUSES = ["booking_requested", "confirmed", "test_completed", "report_ready"];

export default function DiagnosticRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [request, setRequest] = useState<DiagnosticRequest | null>(null);
  const [catalogue, setCatalogue] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [rejectNote, setRejectNote] = useState("");
  // Opening a pending request marks it viewed — once, like opening a letter.
  const markedViewed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([diagnosticService.getOne(id), diagnosticService.listTests().catch(() => [] as DiagnosticTest[])])
      .then(async ([req, tests]) => {
        let current = req;
        if (current.status === "pending" && !markedViewed.current) {
          markedViewed.current = true;
          try {
            await diagnosticService.updateStatus(id, "viewed");
            current = await diagnosticService.getOne(id);
          } catch {
            // Non-critical: the lab can still answer a pending request.
          }
        }
        if (cancelled) return;
        setRequest(current);
        setCatalogue(tests);
        setLoadError(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(true);
        toast.error(getApiErrorMessage(err, "Failed to load request"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  // The prescription is streamed through the authed endpoint into a blob URL.
  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    diagnosticService
      .getFileBlobUrl(id)
      .then((u) => {
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        url = u;
        setFileUrl(u);
      })
      .catch(() => {
        if (!cancelled) setFileUrl(null);
      })
      .finally(() => {
        if (!cancelled) setFileLoading(false);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  /** Re-read the request (the mutation responses may not carry patient/tests). */
  const refresh = async () => {
    try {
      setRequest(await diagnosticService.getOne(id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to refresh request"));
    }
  };

  const changeStatus = async (status: LabStatusChange, success: string, note?: string) => {
    setBusy(true);
    try {
      await diagnosticService.updateStatus(id, status, note);
      toast.success(success);
      setPendingAction(null);
      setRejectNote("");
      await refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update request"));
    } finally {
      setBusy(false);
    }
  };

  const confirmPendingAction = () => {
    if (pendingAction === "complete") void changeStatus("test_completed", "Test marked completed");
    else if (pendingAction === "reject_booking") void changeStatus("rejected", "Booking rejected — patient notified", rejectNote.trim() || undefined);
    else if (pendingAction === "reject") void changeStatus("rejected", "Request rejected — patient notified", rejectNote.trim() || undefined);
  };

  if (loading) return <Loading label="Loading request..." />;

  if (!request) {
    return loadError ? (
      <ErrorState
        description="We couldn't load this request."
        onRetry={() => {
          setLoading(true);
          setReloadKey((k) => k + 1);
        }}
      />
    ) : (
      <Alert severity="warning" sx={{ maxWidth: 480, mx: "auto" }}>
        Request not found
      </Alert>
    );
  }

  const tests = request.tests ?? [];
  const availableTests = tests.filter((t) => t.status === "available");
  const unavailableTests = tests.filter((t) => t.status === "unavailable");
  const selectedTests = tests.filter((t) => t.isSelected);
  const bookingTotal = selectedTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  const answerable = ANSWERABLE_STATUSES.includes(request.status);
  // Pending/viewed: always the editor. Available: the answer, with "Edit response".
  const showEditor = answerable && (request.status !== "available" || editing);
  const canRejectRequest = REJECTABLE_STATUSES.includes(request.status) && request.status !== "booking_requested";
  const isBooked = BOOKED_STATUSES.includes(request.status);
  const answerKey = `${request.id}-${request.updatedAt}`;

  return (
    <Stack spacing={3} sx={{ maxWidth: 1200, mx: "auto" }}>
      <PageTitle
        title={`Request #${request.id}`}
        subtitle="Check the prescription, answer which tests you can do, then confirm bookings and upload reports"
        actions={
          <Stack direction="row" spacing={1}>
            {canRejectRequest && (
              <Button size="small" color="error" variant="outlined" disabled={busy} onClick={() => setPendingAction("reject")}>
                Reject
              </Button>
            )}
            <Button size="small" variant="outlined" onClick={() => router.push(ROUTES.DIAGNOSTICS)}>
              Back
            </Button>
          </Stack>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 5fr) minmax(0, 7fr)" },
        }}
      >
        {/* Left: the shared prescription + who sent it */}
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Patient: {request.patient?.name || "N/A"}
                  </Typography>
                  <Chip
                    label={diagnosticStatusLabel[request.status] ?? request.status}
                    color={diagnosticStatusColor[request.status] ?? "default"}
                    size="small"
                  />
                </Stack>
                {request.patient?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    Phone: {request.patient.phone}
                  </Typography>
                )}
                {request.notes && (
                  <Typography variant="body2" color="text.secondary">
                    Notes: {request.notes}
                  </Typography>
                )}
                {request.labNote && (
                  <Typography variant="body2" color="text.secondary">
                    Lab note: {request.labNote}
                  </Typography>
                )}
                <Typography variant="caption" color="text.disabled">
                  Shared {new Date(request.createdAt).toLocaleString()}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Prescription File
              </Typography>
              {fileLoading ? (
                <Box sx={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loading label="Loading file..." />
                </Box>
              ) : fileUrl ? (
                <iframe
                  src={fileUrl}
                  title="Prescription"
                  style={{ width: "100%", height: 480, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8 }}
                />
              ) : (
                <Alert severity="info">The prescription file could not be loaded.</Alert>
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* Right: answer, booking and reports */}
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          {isBooked && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {request.status === "booking_requested" ? "Booking request" : "Booking"}
                </Typography>
                <Stack spacing={1}>
                  {selectedTests.map((t) => (
                    <Stack key={t.id} direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2">{t.testName}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(t.price)}
                      </Typography>
                    </Stack>
                  ))}
                  <Divider />
                  <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Total
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatCurrency(bookingTotal)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Preferred date: <strong>{formatDay(request.preferredDate)}</strong>
                  </Typography>
                  {request.bookingNotes && (
                    <Typography variant="body2" color="text.secondary">
                      Patient notes: {request.bookingNotes}
                    </Typography>
                  )}
                </Stack>

                {request.status === "booking_requested" && (
                  <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      disabled={busy}
                      onClick={() => changeStatus("confirmed", "Booking confirmed — patient notified")}
                    >
                      Confirm booking
                    </Button>
                    <Button variant="outlined" color="error" disabled={busy} onClick={() => setPendingAction("reject_booking")}>
                      Reject booking
                    </Button>
                  </Stack>
                )}
                {request.status === "confirmed" && (
                  <Button variant="contained" disabled={busy} onClick={() => setPendingAction("complete")} sx={{ mt: 2 }}>
                    Mark test completed
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {REPORT_STATUSES.includes(request.status) && (
            <ReportsCard key={answerKey} request={request} onUploaded={() => void refresh()} />
          )}

          {showEditor ? (
            <AnswerEditor
              key={answerKey}
              request={request}
              catalogue={catalogue}
              onSubmitted={() => {
                setEditing(false);
                void refresh();
              }}
              onCancel={request.status === "available" ? () => setEditing(false) : undefined}
            />
          ) : (
            tests.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Your answer
                    </Typography>
                    {request.status === "available" && (
                      <Button size="small" variant="outlined" onClick={() => setEditing(true)}>
                        Edit response
                      </Button>
                    )}
                  </Stack>
                  {availableTests.length > 0 && (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Available
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 0.5, mb: 2 }}>
                        {availableTests.map((t) => (
                          <Stack key={t.id} direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="body2">
                              {t.testName}
                              {t.isSelected && (
                                <Chip label="Booked" size="small" color="secondary" variant="outlined" sx={{ ml: 1, height: 20, fontSize: "0.65rem" }} />
                              )}
                            </Typography>
                            <Chip label={formatCurrency(t.price)} color="success" size="small" variant="outlined" />
                          </Stack>
                        ))}
                      </Stack>
                    </>
                  )}
                  {unavailableTests.length > 0 && (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Not available
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 0.5 }}>
                        {unavailableTests.map((t) => (
                          <Stack key={t.id} direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="body2">
                              {t.testName}
                              {t.reason && (
                                <Typography component="span" variant="caption" color="text.secondary">
                                  {" "}— {t.reason}
                                </Typography>
                              )}
                            </Typography>
                            <Chip label="unavailable" color="warning" size="small" variant="outlined" />
                          </Stack>
                        ))}
                      </Stack>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          )}

          {request.status === "rejected" && tests.length === 0 && (
            <Alert severity="error">This request was rejected.</Alert>
          )}
        </Stack>
      </Box>

      <ConfirmDialog
        open={pendingAction === "reject" || pendingAction === "reject_booking"}
        title={pendingAction === "reject_booking" ? "Reject this booking?" : "Reject this request?"}
        tone="error"
        confirmLabel={pendingAction === "reject_booking" ? "Reject booking" : "Reject request"}
        loading={busy}
        onConfirm={confirmPendingAction}
        onClose={() => {
          setPendingAction(null);
          setRejectNote("");
        }}
        description={
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <span>The patient will be notified. This can&apos;t be undone.</span>
            <TextField
              label="Reason (optional)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        }
      />

      <ConfirmDialog
        open={pendingAction === "complete"}
        title="Mark test completed?"
        description="Confirm the patient's tests have been done. You can then upload their reports."
        confirmLabel="Mark completed"
        loading={busy}
        onConfirm={confirmPendingAction}
        onClose={() => setPendingAction(null)}
      />
    </Stack>
  );
}
