import apiClient from "@/utils/apiClient";
import { API_ENDPOINTS } from "@/config/api";
import type { Invoice, MedicineOrder, OrderGroup, Page, PaginatedResponse } from "@/types";

interface ListParams {
  status?: string;
  page?: number;
  limit?: number;
}

/** Server-side filters of the pharmacy's order list (IST days for from/to). */
export interface OrderGroupParams extends ListParams {
  paymentStatus?: string;
  paymentMethod?: string;
  search?: string;
  from?: string;
  to?: string;
  medicineId?: number;
}

export const orderService = {
  /** Legacy per-line list (one row per medicine). */
  async getProviderOrders(params: ListParams = {}): Promise<PaginatedResponse<MedicineOrder>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PROVIDER_ORDERS, { params });
    return data.data;
  },

  async getOrder(id: string | number): Promise<MedicineOrder> {
    const { data } = await apiClient.get(API_ENDPOINTS.ORDER_DETAIL(id));
    return data.data.order;
  },

  async updateStatus(id: string | number, status: string): Promise<MedicineOrder> {
    const { data } = await apiClient.put(API_ENDPOINTS.ORDER_STATUS(id), { status });
    return data.data.order;
  },

  // ── Order groups: one order / bill per checkout ─────────────────────────

  async listGroups(params: OrderGroupParams = {}): Promise<Page<"orders", OrderGroup>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PROVIDER_ORDER_GROUPS, { params });
    return data.data;
  },

  async getGroup(id: string | number): Promise<OrderGroup> {
    const { data } = await apiClient.get(API_ENDPOINTS.ORDER_GROUP(id));
    return data.data.order;
  },

  async updateGroupStatus(id: string | number, status: string): Promise<OrderGroup> {
    const { data } = await apiClient.put(API_ENDPOINTS.ORDER_GROUP_STATUS(id), { status });
    return data.data.order;
  },

  /** UPI-QR orders only: the pharmacy confirms the money reached its UPI account. */
  async confirmPaymentReceived(id: string | number): Promise<OrderGroup> {
    const { data } = await apiClient.post(API_ENDPOINTS.ORDER_GROUP_CONFIRM_PAYMENT(id));
    return data.data.order;
  },

  async getInvoice(id: string | number): Promise<Invoice> {
    const { data } = await apiClient.get(API_ENDPOINTS.ORDER_GROUP_INVOICE(id));
    return data.data.invoice;
  },
};
