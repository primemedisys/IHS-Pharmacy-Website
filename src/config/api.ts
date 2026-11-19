import { env } from "./env";

export const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/auth/medicine/login",
  AUTH_GOOGLE: "/auth/medicine/google",
  AUTH_REGISTER: "/auth/register",
  AUTH_ME: "/auth/me",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_REFRESH: "/auth/refresh",

  // Medicine store / marketplace
  MEDICINE_BROWSE: "/medicine/browse",
  MEDICINE_CATEGORIES: "/medicine/categories",
  MEDICINE_DETAILS: (id: string | number) => `/medicine/medicine/${id}`,
  PROVIDER_PROFILE: (id: string | number) => `/medicine/provider/${id}`,
  MY_MEDICINES: "/medicine/my-medicines",
  MY_MEDICINE: (id: string | number) => `/medicine/my-medicines/${id}`,

  // Global medicine catalogue (search before adding to own inventory)
  MEDICINE_MASTERS: "/medicine/masters",
  MASTER_MEDIA: (id: string | number) => `/medicine/masters/${id}/media`,
  MASTER_IMAGES: (id: string | number) => `/medicine/masters/${id}/images`,
  MASTER_IMAGE: (id: string | number, imageId: string | number) => `/medicine/masters/${id}/images/${imageId}`,
  MASTER_IMAGE_ORDER: (id: string | number) => `/medicine/masters/${id}/images/order`,
  MASTER_SUBSTITUTES: (id: string | number) => `/medicine/masters/${id}/substitutes`,

  // Global categories (list / search / find-or-create)
  MY_CATEGORIES: "/medicine/my-categories",

  // Orders
  ORDERS: "/medicine/orders",
  MY_ORDERS: "/medicine/orders/my-orders",
  PROVIDER_ORDERS: "/medicine/orders/provider-orders",
  ORDER_DETAIL: (id: string | number) => `/medicine/orders/${id}`,
  ORDER_STATUS: (id: string | number) => `/medicine/orders/${id}/status`,
  ORDER_CANCEL: (id: string | number) => `/medicine/orders/${id}/cancel`,
  // Order groups (one checkout = one order/bill per pharmacy)
  PROVIDER_ORDER_GROUPS: "/medicine/orders/groups/provider",
  ORDER_GROUP: (id: string | number) => `/medicine/orders/groups/${id}`,
  ORDER_GROUP_STATUS: (id: string | number) => `/medicine/orders/groups/${id}/status`,
  ORDER_GROUP_INVOICE: (id: string | number) => `/medicine/orders/groups/${id}/invoice`,
  ORDER_GROUP_CONFIRM_PAYMENT: (id: string | number) => `/medicine/orders/groups/${id}/payment/confirm-received`,

  // Pharmacy management (stock, purchases, billing, reports)
  PHARMACY_DASHBOARD: "/medicine/pharmacy/dashboard",
  PHARMACY_DASHBOARD_ANALYTICS: "/medicine/pharmacy/dashboard/analytics",
  PHARMACY_REPORT: (name: "sales" | "top-medicines" | "purchases" | "gst" | "stock") => `/medicine/pharmacy/reports/${name}`,
  PHARMACY_BATCHES: "/medicine/pharmacy/batches",
  PHARMACY_WRITE_OFF: "/medicine/pharmacy/batches/write-off-expired",
  PHARMACY_RECEIVE_STOCK: (id: string | number) => `/medicine/pharmacy/inventory/${id}/stock`,
  PHARMACY_BATCH: (id: string | number, batchId: string | number) => `/medicine/pharmacy/inventory/${id}/batches/${batchId}`,
  PHARMACY_MOVEMENTS: (id: string | number) => `/medicine/pharmacy/inventory/${id}/movements`,
  PHARMACY_IMPORT_TEMPLATE: "/medicine/pharmacy/import/template",
  PHARMACY_IMPORT_PREVIEW: "/medicine/pharmacy/import/preview",
  PHARMACY_IMPORT: "/medicine/pharmacy/import",
  PHARMACY_EXPORT: "/medicine/pharmacy/export",
  PHARMACY_SUPPLIERS: "/medicine/pharmacy/suppliers",
  PHARMACY_SUPPLIER: (id: string | number) => `/medicine/pharmacy/suppliers/${id}`,
  PHARMACY_PURCHASES: "/medicine/pharmacy/purchases",
  PHARMACY_PURCHASE: (id: string | number) => `/medicine/pharmacy/purchases/${id}`,
  PHARMACY_PURCHASE_CANCEL: (id: string | number) => `/medicine/pharmacy/purchases/${id}/cancel`,
  PHARMACY_ORDER_RETURNS: (id: string | number) => `/medicine/pharmacy/orders/${id}/returns`,
  PHARMACY_RETURNS: "/medicine/pharmacy/returns",
  PHARMACY_RETURN: (id: string | number) => `/medicine/pharmacy/returns/${id}`,
  PHARMACY_PAYMENTS: "/medicine/pharmacy/payments",
  PHARMACY_SETTINGS: "/medicine/pharmacy/settings",
  PHARMACY_PAYMENT_QR: "/medicine/pharmacy/payment-qr",
  PHARMACY_PAYMENT_QR_IMAGE: "/medicine/pharmacy/payment-qr/image",

  // Notifications
  NOTIFICATIONS: "/medicine/notifications",
  NOTIFICATION_UNREAD: "/medicine/notifications/unread-count",
  NOTIFICATION_READ: (id: string | number) => `/medicine/notifications/${id}/read`,
  NOTIFICATION_READ_ALL: "/medicine/notifications/read-all",

  // Prescription requests (provider receives from patients)
  PROVIDER_PRESCRIPTION_REQUESTS: "/medicine/prescriptions/provider-requests",
  PRESCRIPTION_REQUEST_DETAIL: (id: string | number) => `/medicine/prescriptions/${id}`,
  PRESCRIPTION_REQUEST_STATUS: (id: string | number) => `/medicine/prescriptions/${id}/status`,
  PRESCRIPTION_REQUEST_AVAILABILITY: (id: string | number) => `/medicine/prescriptions/${id}/availability`,
  PRESCRIPTION_REQUEST_FILE: (id: string | number) => `/medicine/prescriptions/${id}/file`,

  // Diagnostic Lab Center (role diagnostic_lab)
  DIAGNOSTIC_SUMMARY: "/diagnostics/summary",
  DIAGNOSTIC_INCOMING: "/diagnostics/requests/incoming",
  DIAGNOSTIC_REQUEST: (id: string | number) => `/diagnostics/requests/${id}`,
  DIAGNOSTIC_REQUEST_FILE: (id: string | number) => `/diagnostics/requests/${id}/file`,
  DIAGNOSTIC_REQUEST_STATUS: (id: string | number) => `/diagnostics/requests/${id}/status`,
  DIAGNOSTIC_REQUEST_RESPONSE: (id: string | number) => `/diagnostics/requests/${id}/response`,
  DIAGNOSTIC_REQUEST_REPORTS: (id: string | number) => `/diagnostics/requests/${id}/reports`,
  DIAGNOSTIC_TEST_REPORT: (id: string | number, testId: string | number) => `/diagnostics/requests/${id}/tests/${testId}/report`,
  DIAGNOSTIC_TESTS: "/diagnostics/tests",
  DIAGNOSTIC_TEST: (id: string | number) => `/diagnostics/tests/${id}`,
} as const;
