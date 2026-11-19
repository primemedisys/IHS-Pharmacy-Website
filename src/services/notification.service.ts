import apiClient from "@/utils/apiClient";
import { API_ENDPOINTS } from "@/config/api";
import type { MedicineNotification, PaginatedResponse } from "@/types";

interface ListParams {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export const notificationService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<MedicineNotification>> {
    const { data } = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS, { params });
    return data.data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get(API_ENDPOINTS.NOTIFICATION_UNREAD);
    return data.data.unreadCount;
  },

  async markAsRead(id: string | number): Promise<void> {
    await apiClient.put(API_ENDPOINTS.NOTIFICATION_READ(id));
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.put(API_ENDPOINTS.NOTIFICATION_READ_ALL);
  },
};
