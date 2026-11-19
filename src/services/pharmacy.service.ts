import apiClient from "@/utils/apiClient";
import { API_ENDPOINTS } from "@/config/api";
import type {
  BatchRow,
  CreditNote,
  GstReport,
  ImportPreview,
  ImportResult,
  Medicine,
  Page,
  PaymentQr,
  PaymentRecord,
  DashboardAnalytics,
  PharmacyDashboard,
  PharmacyStoreSettings,
  Purchase,
  PurchaseReport,
  ReportGroupBy,
  SalesReport,
  StockMovement,
  StockReport,
  Supplier,
  TopMedicinesReport,
} from "@/types";

/** IST days, inclusive: "YYYY-MM-DD". */
export interface DayRange {
  from?: string;
  to?: string;
}

export interface ReportParams extends DayRange {
  groupBy?: ReportGroupBy;
  limit?: number;
}

export interface SupplierInput {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  isActive?: boolean;
}

/** One purchase line. Totals are never sent — the backend computes them. */
export interface PurchaseLineInput {
  inventoryId?: number;
  medicineMasterId?: number;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  freeQuantity?: number;
  buyingPrice: number;
  mrp?: number | null;
  sellingPrice?: number | null;
  gstRate?: number;
  discountPercent?: number;
}

export interface PurchaseInput {
  supplierId?: number | null;
  invoiceNumber: string;
  invoiceDate: string;
  notes?: string;
  items: PurchaseLineInput[];
}

/** Read the file name the API put in Content-Disposition. */
function fileNameFrom(disposition: string | undefined, fallback: string) {
  const match = /filename="?([^";]+)"?/i.exec(disposition || "");
  return match ? decodeURIComponent(match[1]) : fallback;
}

/** Fetch a generated file with the signed-in user's token and hand it to the browser. */
async function download(url: string, fallbackName: string, params?: Record<string, unknown>) {
  const res = await apiClient.get(url, { params, responseType: "blob" });
  const name = fileNameFrom(res.headers["content-disposition"], fallbackName);
  const href = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

const importForm = (file: File, duplicateStrategy: "skip" | "update") => {
  const form = new FormData();
  form.append("file", file);
  form.append("duplicateStrategy", duplicateStrategy);
  return form;
};

export const pharmacyService = {
  // ── Dashboard + reports ─────────────────────────────────────────────────
  async dashboardAnalytics(params: ReportParams): Promise<DashboardAnalytics> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_DASHBOARD_ANALYTICS, { params });
    return data.data;
  },
  async dashboard(): Promise<PharmacyDashboard> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_DASHBOARD);
    return data.data;
  },
  async salesReport(params: ReportParams): Promise<SalesReport> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_REPORT("sales"), { params });
    return data.data;
  },
  async topMedicines(params: ReportParams): Promise<TopMedicinesReport> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_REPORT("top-medicines"), { params });
    return data.data;
  },
  async purchaseReport(params: ReportParams): Promise<PurchaseReport> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_REPORT("purchases"), { params });
    return data.data;
  },
  async gstReport(params: ReportParams): Promise<GstReport> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_REPORT("gst"), { params });
    return data.data;
  },
  async stockReport(): Promise<StockReport> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_REPORT("stock"));
    return data.data;
  },

  // ── Stock: batches, receipts, corrections, history ──────────────────────
  async listBatches(params: {
    status?: "expired" | "expiring" | "valid" | "all";
    withinDays?: number;
    inStockOnly?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Page<"batches", BatchRow> & { withinDays: number }> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_BATCHES, { params });
    return data.data;
  },
  async writeOffExpired(inventoryId?: number): Promise<{ batches: number; units: number }> {
    const { data } = await apiClient.post(API_ENDPOINTS.PHARMACY_WRITE_OFF, inventoryId ? { inventoryId } : {});
    return data.data;
  },
  async receiveStock(
    inventoryId: number | string,
    body: { batchNumber?: string; expiryDate?: string; quantity: number; buyingPrice?: number | null; mrp?: number | null; note?: string }
  ): Promise<Medicine> {
    const { data } = await apiClient.post(API_ENDPOINTS.PHARMACY_RECEIVE_STOCK(inventoryId), body);
    return data.data.medicine;
  },
  async updateBatch(
    inventoryId: number | string,
    batchId: number,
    body: { quantityAvailable?: number; expiryDate?: string | null; note?: string }
  ): Promise<Medicine> {
    const { data } = await apiClient.put(API_ENDPOINTS.PHARMACY_BATCH(inventoryId, batchId), body);
    return data.data.medicine;
  },
  async movements(inventoryId: number | string, params: { type?: string; page?: number; limit?: number }): Promise<Page<"movements", StockMovement>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_MOVEMENTS(inventoryId), { params });
    return data.data;
  },

  // ── Excel import / export ───────────────────────────────────────────────
  downloadTemplate: () => download(API_ENDPOINTS.PHARMACY_IMPORT_TEMPLATE, "medicine-import-template.xlsx"),
  exportInventory: (active: "active" | "inactive" | "all" = "active") =>
    download(API_ENDPOINTS.PHARMACY_EXPORT, "medicine-inventory.xlsx", { active }),
  async previewImport(file: File, duplicateStrategy: "skip" | "update"): Promise<ImportPreview> {
    const { data } = await apiClient.post(API_ENDPOINTS.PHARMACY_IMPORT_PREVIEW, importForm(file, duplicateStrategy), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
  async commitImport(file: File, duplicateStrategy: "skip" | "update"): Promise<ImportResult> {
    const { data } = await apiClient.post(API_ENDPOINTS.PHARMACY_IMPORT, importForm(file, duplicateStrategy), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  // ── Suppliers ───────────────────────────────────────────────────────────
  async listSuppliers(params: { search?: string; active?: "active" | "inactive" | "all"; page?: number; limit?: number } = {}): Promise<Page<"suppliers", Supplier>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_SUPPLIERS, { params });
    return data.data;
  },
  async createSupplier(body: SupplierInput): Promise<Supplier> {
    const { data } = await apiClient.post(API_ENDPOINTS.PHARMACY_SUPPLIERS, body);
    return data.data.supplier;
  },
  async updateSupplier(id: number, body: SupplierInput): Promise<Supplier> {
    const { data } = await apiClient.put(API_ENDPOINTS.PHARMACY_SUPPLIER(id), body);
    return data.data.supplier;
  },

  // ── Purchases ───────────────────────────────────────────────────────────
  async listPurchases(
    params: DayRange & { search?: string; supplierId?: number; status?: string; inventoryId?: number; page?: number; limit?: number }
  ): Promise<Page<"purchases", Purchase>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_PURCHASES, { params });
    return data.data;
  },
  async getPurchase(id: number | string): Promise<Purchase> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_PURCHASE(id));
    return data.data.purchase;
  },
  async createPurchase(body: PurchaseInput): Promise<Purchase> {
    const { data } = await apiClient.post(API_ENDPOINTS.PHARMACY_PURCHASES, body);
    return data.data.purchase;
  },
  async cancelPurchase(id: number | string): Promise<Purchase> {
    const { data } = await apiClient.post(API_ENDPOINTS.PHARMACY_PURCHASE_CANCEL(id));
    return data.data.purchase;
  },

  // ── Billing: returns / credit notes, payments ───────────────────────────
  async createReturn(orderGroupId: number | string, body: { items: Array<{ orderLineId: number; quantity: number }>; reason?: string; restock: boolean }): Promise<CreditNote> {
    const { data } = await apiClient.post(API_ENDPOINTS.PHARMACY_ORDER_RETURNS(orderGroupId), body);
    return data.data.return;
  },
  async listReturns(params: DayRange & { search?: string; page?: number; limit?: number }): Promise<Page<"returns", CreditNote>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_RETURNS, { params });
    return data.data;
  },
  async getReturn(id: number | string): Promise<CreditNote> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_RETURN(id));
    return data.data.return;
  },
  async listPayments(params: DayRange & { status?: string; method?: string; page?: number; limit?: number }): Promise<Page<"payments", PaymentRecord>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_PAYMENTS, { params });
    return data.data;
  },

  // ── Settings ────────────────────────────────────────────────────────────
  async getSettings(): Promise<PharmacyStoreSettings | null> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_SETTINGS);
    return data.data.store;
  },
  async updateSettings(body: { gstin?: string; drugLicenseNumber?: string; expiryAlertDays?: number; invoiceNote?: string }): Promise<PharmacyStoreSettings | null> {
    const { data } = await apiClient.put(API_ENDPOINTS.PHARMACY_SETTINGS, body);
    return data.data.store;
  },

  // ── Store payment QR (patients pay the pharmacy directly) ───────────────
  async getPaymentQr(): Promise<PaymentQr> {
    const { data } = await apiClient.get(API_ENDPOINTS.PHARMACY_PAYMENT_QR);
    return data.data;
  },
  /** "" or null clears a field. */
  async updatePaymentQr(body: { upiId?: string | null; payeeName?: string | null; isActive?: boolean }): Promise<PaymentQr> {
    const { data } = await apiClient.put(API_ENDPOINTS.PHARMACY_PAYMENT_QR, body);
    return data.data;
  },
  async uploadPaymentQrImage(file: File): Promise<PaymentQr> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post(API_ENDPOINTS.PHARMACY_PAYMENT_QR_IMAGE, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
  async removePaymentQr(): Promise<PaymentQr> {
    const { data } = await apiClient.delete(API_ENDPOINTS.PHARMACY_PAYMENT_QR);
    return data.data;
  },
};
