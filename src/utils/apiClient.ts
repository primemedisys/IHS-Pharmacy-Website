import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/config/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach access token from cookie
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // A 401 from the credential endpoints themselves (wrong password, bad
    // refresh) is an answer, not an expired session: let the caller show it
    // instead of hard-reloading /login (which blinked the page and lost the toast).
    const url: string = originalRequest?.url ?? "";
    const isAuthEndpoint = /\/auth\/(medicine\/login|medicine\/google|register|refresh)/.test(url);

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefresh } = data.data || data;
          Cookies.set("access_token", accessToken, { expires: 1, sameSite: "lax", secure: typeof window !== "undefined" && window.location.protocol === "https:" });
          Cookies.set("refresh_token", newRefresh, { expires: 7, sameSite: "lax", secure: typeof window !== "undefined" && window.location.protocol === "https:" });
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
