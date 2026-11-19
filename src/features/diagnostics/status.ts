import type { DiagnosticReportFileType, DiagnosticRequestStatus } from "@/types";

type ChipColor = "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error";

/** Every request status, in lifecycle order (used for the status tabs). */
export const DIAGNOSTIC_STATUSES: DiagnosticRequestStatus[] = [
  "pending",
  "viewed",
  "available",
  "booking_requested",
  "confirmed",
  "test_completed",
  "report_ready",
  "rejected",
];

export const diagnosticStatusLabel: Record<DiagnosticRequestStatus, string> = {
  pending: "Pending",
  viewed: "Viewed",
  available: "Tests available",
  booking_requested: "Booking requested",
  confirmed: "Confirmed",
  test_completed: "Test completed",
  report_ready: "Report ready",
  rejected: "Rejected",
};

export const diagnosticStatusColor: Record<DiagnosticRequestStatus, ChipColor> = {
  pending: "warning",
  viewed: "info",
  available: "primary",
  booking_requested: "secondary",
  confirmed: "success",
  test_completed: "info",
  report_ready: "success",
  rejected: "error",
};

export const REPORT_FILE_TYPES: { value: DiagnosticReportFileType; label: string }[] = [
  { value: "lab_report", label: "Lab report" },
  { value: "xray", label: "X-Ray" },
  { value: "mri", label: "MRI" },
  { value: "other", label: "Other" },
];

/** Statuses in which the lab may (re-)send its test answer. */
export const ANSWERABLE_STATUSES: DiagnosticRequestStatus[] = ["pending", "viewed", "available"];
/** Statuses from which the lab may reject the request. */
export const REJECTABLE_STATUSES: DiagnosticRequestStatus[] = ["pending", "viewed", "available", "booking_requested"];
/** Statuses in which reports can be uploaded. */
export const REPORT_STATUSES: DiagnosticRequestStatus[] = ["test_completed", "report_ready"];
