import apiClient from "@/utils/apiClient";
import { API_ENDPOINTS } from "@/config/api";
import type { User, AuthTokens, RegisterableProviderType } from "@/types";

interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: RegisterableProviderType;
  // Structured Google location (users.address_line/city/state/pincode/lat/lng).
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

export const authService = {
  async login(payload: LoginPayload): Promise<{ user: User; tokens: AuthTokens }> {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH_LOGIN, payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<{ user: User; tokens: AuthTokens }> {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, payload);
    return data.data;
  },

  async googleLogin(credential: string): Promise<{ user: User; tokens: AuthTokens }> {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH_GOOGLE, { credential });
    return data.data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get(API_ENDPOINTS.AUTH_ME);
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
  },
};
