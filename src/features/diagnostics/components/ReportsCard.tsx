"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { FiUpload } from "react-icons/fi";
import { toast } from "sonner";
import { Loading } from "@/components/feedback/Loading";
import { diagnosticService } from "@/services/diagnostic.service";
import type { DiagnosticReportFileType, DiagnosticRequest, DiagnosticRequestTest } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatCurrency } from "@/utils/format";
import { REPORT_FILE_TYPES } from "../status";

const REPORT_ACCEPT = "application/pdf,image/*,.dcm,.doc,.docx,.xls,.xlsx,.csv";

interface Viewer {
  test: DiagnosticRequestTest;
  url: string | null;
  loading: boolean;
}

export interface ReportsCardProps {
  request: DiagnosticRequest;
  onUploaded: (request: DiagnosticRequest) => void;
}

/**
 * Reports for the booked tests: view what's uploaded, and upload a file that
 * covers one or more of them. Mount with a `key` so the form resets per upload.
 */
export function ReportsCard({ request, onUploaded }: ReportsCardProps) {
  const selected = (request.tests ?? []).filter((t) => t.isSelected);
  const [file, setFile] = useState<File | null>(null);
  const [testIds, setTestIds] = useState<number[]>(() => selected.filter((t) => !t.report).map((t) => t.id));
  const [fileType, setFileType] = useState<DiagnosticReportFileType>("lab_report");
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  // Revoke the report's blob URL whenever it's replaced or the card unmounts.
  const viewerUrl = viewer?.url ?? null;
  useEffect(() => {
    return () => {
      if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    };
  }, [viewerUrl]);

  const openReport = async (test: DiagnosticRequestTest) => {
    setViewer({ test, url: null, loading: true });
    try {
      const url = await diagnosticService.getReportBlobUrl(request.id, test.id);
      setViewer((v) => {
        if (v?.test.id !== test.id) {
          URL.revokeObjectURL(url);
          return v;
        }
        return { test, url, loading: false };
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load the report"));
      setViewer(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a report file to upload");
      return;
    }
    if (!testIds.length) {
      toast.error("Select the test(s) this report covers");
      return;
    }
    setUploading(true);
    try {
      const updated = await diagnosticService.uploadReport(request.id, file, testIds, fileType);
      toast.success("Report uploaded — patient notified");
      onUploaded(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to upload report"));
    } finally {
      setUploading(false);
    }
  };

  const nameOf = (id: number) => selected.find((t) => t.id === id)?.testName ?? `Test #${id}`;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Reports
        </Typography>

        {selected.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No booked tests on this request.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {selected.map((test) => {
              const uploadedAt = test.reportUploadedAt ?? test.report?.uploadedAt ?? null;
              return (
                <Stack
                  key={test.id}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {test.testName}{" "}
                      <Typography component="span" variant="caption" color="text.secondary">
                        {formatCurrency(test.price)}
                      </Typography>
                    </Typography>
                    {test.report && uploadedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Uploaded {format(new Date(uploadedAt), "dd MMM yyyy, h:mm a")}
                      </Typography>
                    )}
                  </Box>
                  {test.report ? (
                    <Button size="small" variant="outlined" onClick={() => openReport(test)} sx={{ flexShrink: 0 }}>
                      View report
                    </Button>
                  ) : (
                    <Chip label="Awaiting report" size="small" color="warning" variant="outlined" sx={{ alignSelf: { xs: "flex-start", sm: "center" } }} />
                  )}
                </Stack>
              );
            })}
          </Stack>
        )}

        {selected.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Upload a report
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                <Button variant="outlined" component="label" startIcon={<FiUpload />} sx={{ flexShrink: 0 }}>
                  Choose file
                  <input
                    hidden
                    type="file"
                    accept={REPORT_ACCEPT}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </Button>
                <Typography variant="body2" color={file ? "text.primary" : "text.secondary"} noWrap title={file?.name}>
                  {file ? file.name : "PDF, image, DICOM, Word, Excel or CSV"}
                </Typography>
              </Stack>

              <FormControl size="small" fullWidth>
                <InputLabel id="report-tests-label">Tests this report covers</InputLabel>
                <Select<number[]>
                  labelId="report-tests-label"
                  label="Tests this report covers"
                  multiple
                  value={testIds}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTestIds(typeof v === "string" ? v.split(",").map(Number) : v);
                  }}
                  renderValue={(ids) => ids.map(nameOf).join(", ")}
                >
                  {selected.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      <Checkbox size="small" checked={testIds.includes(t.id)} />
                      <ListItemText primary={t.testName} secondary={t.report ? "Report uploaded — will be replaced" : undefined} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ maxWidth: 240 }}>
                <InputLabel id="report-type-label">File type</InputLabel>
                <Select
                  labelId="report-type-label"
                  label="File type"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as DiagnosticReportFileType)}
                >
                  {REPORT_FILE_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Button variant="contained" onClick={handleUpload} disabled={uploading} sx={{ minWidth: 200 }}>
                  {uploading ? "Uploading..." : "Upload report"}
                </Button>
              </Box>
            </Stack>
          </>
        )}
      </CardContent>

      <Dialog open={!!viewer} onClose={() => setViewer(null)} fullWidth maxWidth="md">
        <DialogTitle>{viewer?.test.testName ?? "Report"}</DialogTitle>
        <DialogContent dividers>
          {viewer?.loading ? (
            <Box sx={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loading label="Loading report..." />
            </Box>
          ) : viewer?.url ? (
            <iframe
              src={viewer.url}
              title={`${viewer.test.testName} report`}
              style={{ width: "100%", height: "70vh", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8 }}
            />
          ) : (
            <Alert severity="info">The report could not be loaded.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {viewer?.url && (
            <Button component="a" href={viewer.url} target="_blank" rel="noopener noreferrer">
              Open in new tab
            </Button>
          )}
          <Button onClick={() => setViewer(null)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
