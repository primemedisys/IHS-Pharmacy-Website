import apiClient from "@/utils/apiClient";
import { API_ENDPOINTS } from "@/config/api";
import type {
  DiagnosticReportFileType,
  DiagnosticRequest,
  DiagnosticRequestPage,
  DiagnosticSummary,
  DiagnosticTest,
} from "@/types";

interface ListParams {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/** Lab-driven status changes (`available` / `booking_requested` / `report_ready` are set by other actions). */
export type LabStatusChange = "viewed" | "confirmed" | "test_completed" | "rejected";

/** One answered test, as `PUT /response` expects it. */
export type DiagnosticAnswer =
  | { status: "available"; diagnosticTestId: number; price?: number }
  | { status: "available"; testName: string; price: number }
  | { status: "unavailable"; testName: string; reason?: string };

export interface DiagnosticTestInput {
  name: string;
  price: number;
  description?: string;
  isAvailable?: boolean;
}

export const diagnosticService = {
  async getSummary(): Promise<DiagnosticSummary> {
    const { data } = await apiClient.get(API_ENDPOINTS.DIAGNOSTIC_SUMMARY);
    return data.data;
  },

  async getIncoming(params: ListParams = {}): Promise<DiagnosticRequestPage> {
    const { data } = await apiClient.get(API_ENDPOINTS.DIAGNOSTIC_INCOMING, { params });
    return data.data;
  },

  async getOne(id: string | number): Promise<DiagnosticRequest> {
    const { data } = await apiClient.get(API_ENDPOINTS.DIAGNOSTIC_REQUEST(id));
    return data.data.request;
  },

  async updateStatus(id: string | number, status: LabStatusChange, note?: string): Promise<DiagnosticRequest> {
    const { data } = await apiClient.put(API_ENDPOINTS.DIAGNOSTIC_REQUEST_STATUS(id), {
      status,
      ...(note ? { note } : {}),
    });
    return data.data.request;
  },

  async submitResponse(id: string | number, tests: DiagnosticAnswer[], note?: string): Promise<DiagnosticRequest> {
    const { data } = await apiClient.put(API_ENDPOINTS.DIAGNOSTIC_REQUEST_RESPONSE(id), {
      tests,
      ...(note ? { note } : {}),
    });
    return data.data.request;
  },

  async uploadReport(
    id: string | number,
    file: File,
    testIds: number[],
    fileType: DiagnosticReportFileType,
  ): Promise<DiagnosticRequest> {
    const form = new FormData();
    form.append("report", file);
    testIds.forEach((t) => form.append("testIds", String(t)));
    form.append("fileType", fileType);
    const { data } = await apiClient.post(API_ENDPOINTS.DIAGNOSTIC_REQUEST_REPORTS(id), form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data.request;
  },

  /** The shared prescription, via the AUTHED stream endpoint, as a blob URL (revoke it when done). */
  async getFileBlobUrl(id: string | number): Promise<string> {
    const { data } = await apiClient.get(API_ENDPOINTS.DIAGNOSTIC_REQUEST_FILE(id), { responseType: "blob" });
    return URL.createObjectURL(data as Blob);
  },

  /** A test's uploaded report as a blob URL (revoke it when done). */
  async getReportBlobUrl(id: string | number, testId: string | number): Promise<string> {
    const { data } = await apiClient.get(API_ENDPOINTS.DIAGNOSTIC_TEST_REPORT(id, testId), { responseType: "blob" });
    return URL.createObjectURL(data as Blob);
  },

  // ── Catalogue ──
  async listTests(search?: string): Promise<DiagnosticTest[]> {
    const { data } = await apiClient.get(API_ENDPOINTS.DIAGNOSTIC_TESTS, {
      params: search ? { search } : undefined,
    });
    return data.data.tests || [];
  },

  async createTest(input: DiagnosticTestInput): Promise<DiagnosticTest> {
    const { data } = await apiClient.post(API_ENDPOINTS.DIAGNOSTIC_TESTS, input);
    return data.data.test;
  },

  async updateTest(id: string | number, input: Partial<DiagnosticTestInput>): Promise<DiagnosticTest> {
    const { data } = await apiClient.put(API_ENDPOINTS.DIAGNOSTIC_TEST(id), input);
    return data.data.test;
  },

  async deleteTest(id: string | number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DIAGNOSTIC_TEST(id));
  },
};
