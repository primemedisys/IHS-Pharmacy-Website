import apiClient from "@/utils/apiClient";
import { API_ENDPOINTS } from "@/config/api";
import type { PaginatedResponse, PrescriptionRequest } from "@/types";

interface ListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface AvailabilityAnswer {
  status: "available" | "unavailable";
  medicineId?: number;
  medicineName?: string;
  quantity?: number;
  reason?: string;
}

export const prescriptionService = {
  async getProviderRequests(params: ListParams = {}): Promise<PaginatedResponse<PrescriptionRequest>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PROVIDER_PRESCRIPTION_REQUESTS, { params });
    return data.data;
  },

  async getOne(id: string | number): Promise<PrescriptionRequest> {
    const { data } = await apiClient.get(API_ENDPOINTS.PRESCRIPTION_REQUEST_DETAIL(id));
    return data.data.request;
  },

  async updateStatus(id: string | number, status: string): Promise<PrescriptionRequest> {
    const { data } = await apiClient.put(API_ENDPOINTS.PRESCRIPTION_REQUEST_STATUS(id), { status });
    return data.data.request;
  },

  async submitAvailability(id: string | number, items: AvailabilityAnswer[]): Promise<PrescriptionRequest> {
    const { data } = await apiClient.put(API_ENDPOINTS.PRESCRIPTION_REQUEST_AVAILABILITY(id), { items });
    return data.data.request;
  },

  /**
   * Fetch the prescription file through the AUTHED stream endpoint and turn it
   * into a blob URL so the provider can view it without exposing a public URL.
   */
  async getFileBlobUrl(id: string | number): Promise<string> {
    const { data } = await apiClient.get(API_ENDPOINTS.PRESCRIPTION_REQUEST_FILE(id), {
      responseType: "blob",
    });
    return URL.createObjectURL(data as Blob);
  },
};