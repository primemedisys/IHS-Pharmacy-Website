import apiClient from "@/utils/apiClient";
import { API_ENDPOINTS } from "@/config/api";
import type { Medicine, MedicineCategory, MedicineMaster, MedicineMedia, PaginatedResponse } from "@/types";

/** The pharmacy's own commercial data on an inventory row (all optional except the selling price). */
export interface InventoryCommercial {
  /** Selling price per unit, GST-inclusive. */
  price: number;
  mrp?: number | null;
  /** Purchase rate per unit, excl. GST — private to the pharmacy. */
  buyingPrice?: number | null;
  gstRate?: number;
  discountPercent?: number;
  minStock?: number;
  sku?: string;
  hsnCode?: string;
  packSize?: string;
  supplierId?: number | null;
}

/**
 * Add-to-inventory payload: an existing global master OR a new medicine's
 * details, plus own price / stock. Opening stock goes into `batchNumber`
 * (with `expiryDate`) when given. No image is ever required.
 */
export interface CreateInventoryPayload extends InventoryCommercial {
  medicineMasterId?: number;
  medicineName?: string;
  genericName?: string;
  medicineType?: string;
  strength?: string;
  manufacturer?: string;
  description?: string;
  categoryId?: number;
  stock: number;
  batchNumber?: string;
  expiryDate?: string;
  location?: string;
}

/** Only the provider-specific fields of an inventory row are editable. */
export interface UpdateInventoryPayload extends Partial<InventoryCommercial> {
  /** New TOTAL stock — a manual correction applied to the untracked units. */
  stock?: number;
  stockNote?: string;
  location?: string;
  isActive?: boolean;
}

export interface ListParams {
  search?: string;
  category?: number;
  form?: string;
  stockStatus?: "in" | "low" | "out";
  expiry?: "expired" | "expiring" | "valid" | "none";
  supplierId?: number;
  active?: "active" | "inactive" | "all";
  sort?: "name" | "stock" | "price" | "expiry" | "updated";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export const medicineService = {
  async listMy(params: ListParams = {}): Promise<PaginatedResponse<Medicine>> {
    const { data } = await apiClient.get(API_ENDPOINTS.MY_MEDICINES, { params });
    return data.data;
  },

  async getOne(id: string | number): Promise<Medicine> {
    const { data } = await apiClient.get(API_ENDPOINTS.MY_MEDICINE(id));
    return data.data.medicine;
  },

  async create(payload: CreateInventoryPayload): Promise<Medicine> {
    const { data } = await apiClient.post(API_ENDPOINTS.MY_MEDICINES, payload);
    return data.data.medicine;
  },

  async update(id: string | number, payload: UpdateInventoryPayload): Promise<Medicine> {
    const { data } = await apiClient.put(API_ENDPOINTS.MY_MEDICINE(id), payload);
    return data.data.medicine;
  },

  async remove(id: string | number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.MY_MEDICINE(id));
  },

  /** Search the GLOBAL medicine catalogue (case-insensitive). */
  async searchMasters(search: string, limit = 20): Promise<MedicineMaster[]> {
    const { data } = await apiClient.get(API_ENDPOINTS.MEDICINE_MASTERS, { params: { search: search || undefined, limit } });
    return data.data.masters;
  },

  /** Images + substitutes of a GLOBAL medicine (shared by every pharmacy selling it). */
  async getMedia(masterId: number): Promise<MedicineMedia> {
    const { data } = await apiClient.get(API_ENDPOINTS.MASTER_MEDIA(masterId));
    return data.data;
  },

  /** Upload ONE image (multipart field "image") to the existing storage; returns the updated media. */
  async uploadImage(masterId: number, file: File): Promise<MedicineMedia> {
    const form = new FormData();
    form.append("image", file);
    const { data } = await apiClient.post(API_ENDPOINTS.MASTER_IMAGES(masterId), form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async removeImage(masterId: number, imageId: number): Promise<MedicineMedia> {
    const { data } = await apiClient.delete(API_ENDPOINTS.MASTER_IMAGE(masterId, imageId));
    return data.data;
  },

  /** New display order — every image id of the medicine, primary first. */
  async reorderImages(masterId: number, imageIds: number[]): Promise<MedicineMedia> {
    const { data } = await apiClient.put(API_ENDPOINTS.MASTER_IMAGE_ORDER(masterId), { imageIds });
    return data.data;
  },

  /** Replace the substitute set with existing global medicines (ids only). */
  async setSubstitutes(masterId: number, substituteIds: number[]): Promise<MedicineMedia> {
    const { data } = await apiClient.put(API_ENDPOINTS.MASTER_SUBSTITUTES(masterId), { substituteIds });
    return data.data;
  },

  /** Global categories (every provider sees the same list); `search` is case-insensitive. */
  async listCategories(search?: string): Promise<MedicineCategory[]> {
    const { data } = await apiClient.get(API_ENDPOINTS.MY_CATEGORIES, { params: { search: search || undefined } });
    return data.data.categories;
  },

  /**
   * Find-or-create a global category. `created: false` means an equivalent
   * (case-insensitive) category already existed and is returned instead.
   */
  async createCategory(payload: { name: string }): Promise<{ category: MedicineCategory; created: boolean }> {
    const { data } = await apiClient.post(API_ENDPOINTS.MY_CATEGORIES, payload);
    return data.data;
  },
};
