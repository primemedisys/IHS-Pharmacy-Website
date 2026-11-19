/**
 * Provider types. `mr` (Medicine Representative) is RETIRED: it stays
 * in the type only because existing accounts and their historical rows still
 * carry it. No new account can be registered as `mr`. `diagnostic_lab` is a
 * Diagnostic Lab Center — a provider, but NOT a medicine seller.
 */
export type ProviderType = "medicine_store" | "pharmacy_hospital" | "mr" | "diagnostic_lab";

/** The provider types a new provider can register as. */
export type RegisterableProviderType = Exclude<ProviderType, "mr">;

export type UserRole = ProviderType | "patient" | "doctor" | "admin" | "clinic";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profilePhotoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
  message: string;
}

/** A GLOBAL category (shared by every provider). `id` is a number. */
export interface MedicineCategory {
  id: number;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * A GLOBAL medicine (backend `medicine_masters`), shared by every provider.
 * Price/stock are NOT here — they live on each provider's own `Medicine`
 * (inventory) row. IDs are numbers end-to-end (INT/BIGINT → JSON number).
 */
export interface MedicineMaster {
  id: number;
  medicineName: string;
  genericName?: string | null;
  medicineType: string;
  strength?: string | null;
  manufacturer?: string | null;
  description?: string | null;
  categoryId?: number | null;
  category?: Pick<MedicineCategory, "id" | "name" | "slug"> | null;
  /** True when the signed-in provider already sells it. */
  inMyInventory?: boolean;
  myInventoryId?: number | null;
}

/** One package / strip photo of a GLOBAL medicine (backend `medicine_master_images`). */
export interface MedicineImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
  uploadedBy?: number | null;
  /** Only the uploader or an admin may remove an image. */
  canDelete?: boolean;
}

/** A substitute is another existing global medicine — never a copy. */
export type SubstituteMaster = Pick<
  MedicineMaster,
  "id" | "medicineName" | "genericName" | "medicineType" | "strength" | "manufacturer"
>;

/** Images + substitutes of a global medicine, as the curation endpoints return them. */
export interface MedicineMedia {
  masterId: number;
  images: MedicineImage[];
  substitutes: SubstituteMaster[];
  maxImages: number;
  maxSubstitutes: number;
  /** True when this pharmacy sells the medicine (or is an admin) and may curate it. */
  canEdit: boolean;
}

/** DECIMAL columns arrive as strings ("250.00"); wrap in Number() before maths. */
export type Money = number | string;

export type StockStatus = "in" | "low" | "out";
export type ExpiryStatus = "expired" | "expiring" | "ok";

/** One batch of an inventory row (backend `medicine_stock_batches`). */
export interface StockBatch {
  id: number;
  batchNumber: string;
  /** "YYYY-MM-DD", or null when no expiry was recorded. */
  expiryDate: string | null;
  quantityReceived: number;
  quantityAvailable: number;
  buyingPrice?: Money | null;
  mrp?: Money | null;
  supplierId?: number | null;
  supplier?: { id: number; name: string } | null;
  expiryStatus?: ExpiryStatus | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * A provider's OWN inventory row: a global medicine at this provider's price,
 * stock, GST, discount and cost. `price` is GST-inclusive; `buyingPrice` is
 * excl. GST and private to the pharmacy.
 */
export interface Medicine {
  id: number;
  providerId: number;
  providerType: ProviderType;
  categoryId?: number;
  medicineMasterId?: number | null;
  master?: MedicineMaster | null;
  medicineName: string;
  genericName?: string;
  medicineType: string;
  strength?: string;
  manufacturer?: string;
  description?: string;
  sku?: string | null;
  hsnCode?: string | null;
  packSize?: string | null;
  mrp?: Money | null;
  buyingPrice?: Money | null;
  /** Selling price per unit, GST-inclusive, before the item discount. */
  price: Money;
  gstRate?: Money;
  discountPercent?: Money;
  stock: number;
  minStock?: number;
  /** Nearest-expiring batch that still has stock (summary maintained by the backend). */
  batchNumber?: string | null;
  expiryDate?: string | null;
  supplierId?: number | null;
  supplier?: { id: number; name: string; phone?: string | null } | null;
  location?: string;
  imageUrl?: string;
  isActive: boolean;
  category?: MedicineCategory;
  // Derived by the backend from the stored columns:
  effectivePrice?: number;
  unitMargin?: number | null;
  stockStatus?: StockStatus;
  expiryStatus?: ExpiryStatus | null;
  primaryImageUrl?: string | null;
  // Detail view only:
  batches?: StockBatch[];
  untrackedStock?: number;
  expiryAlertDays?: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "on_the_way"
  | "delivered"
  | "rejected"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface MedicineOrder {
  id: number;
  patientId: number;
  providerId: number;
  providerType: ProviderType;
  medicineId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress?: string;
  notes?: string;
  medicine?: Medicine;
  patient?: User;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  referenceId?: number;
  referenceType?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  medicines?: T[];
  orders?: T[];
  notifications?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PrescriptionRequestStatus = "pending" | "viewed" | "processing" | "completed" | "rejected";
export type PrescriptionItemStatus = "available" | "unavailable";

export interface PrescriptionRequestItem {
  id: number;
  prescriptionRequestId: number;
  medicineId?: number | null;
  medicineName: string;
  quantity?: number | null;
  price?: number | null;
  status: PrescriptionItemStatus;
  reason?: string | null;
  medicine?: Pick<Medicine, "id" | "medicineName" | "medicineType" | "strength" | "price" | "stock" | "imageUrl"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionRequest {
  id: number;
  patientId: number;
  providerId: number;
  providerType: ProviderType;
  fileUrl: string;
  fileName?: string | null;
  notes?: string | null;
  status: PrescriptionRequestStatus;
  patient?: { id: number; name: string; phone: string };
  provider?: { id: number; name: string };
  items?: PrescriptionRequestItem[];
  createdAt: string;
  updatedAt: string;
}

// ── Diagnostic Lab Center ──────────────────────────────────────────────────

export type DiagnosticRequestStatus =
  | "pending"
  | "viewed"
  | "available"
  | "booking_requested"
  | "confirmed"
  | "test_completed"
  | "report_ready"
  | "rejected";

export type DiagnosticReportFileType = "lab_report" | "xray" | "mri" | "other";

/** A test in the lab's own catalogue. `price` is a DECIMAL string ("5000.00"). */
export interface DiagnosticTest {
  id: number;
  labId: number;
  name: string;
  description?: string | null;
  price: string | number;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One answered test on a request (available with a price, or unavailable with a reason). */
export interface DiagnosticRequestTest {
  id: number;
  diagnosticRequestId: number;
  diagnosticTestId: number | null;
  testName: string;
  price: string | number | null;
  status: "available" | "unavailable";
  reason: string | null;
  isSelected: boolean;
  reportRecordId: number | null;
  reportUploadedAt: string | null;
  report: {
    id: number;
    fileType: DiagnosticReportFileType;
    tag?: string | null;
    recordDate?: string | null;
    uploadedAt?: string | null;
  } | null;
}

export interface DiagnosticRequest {
  id: number;
  patientId: number;
  labId: number;
  fileName?: string | null;
  notes?: string | null;
  status: DiagnosticRequestStatus;
  labNote?: string | null;
  /** "YYYY-MM-DD" */
  preferredDate?: string | null;
  bookingNotes?: string | null;
  respondedAt?: string | null;
  bookingRequestedAt?: string | null;
  confirmedAt?: string | null;
  completedAt?: string | null;
  reportReadyAt?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: { id: number; name: string; phone?: string | null };
  lab?: { id: number; name: string; phone?: string | null; addressLine?: string | null; city?: string | null; state?: string | null; pincode?: string | null };
  tests?: DiagnosticRequestTest[];
}

export interface DiagnosticSummary {
  total: number;
  byStatus: Partial<Record<DiagnosticRequestStatus, number>>;
  tests: number;
}

export interface DiagnosticRequestPage {
  requests: DiagnosticRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Pharmacy management (backend migration 043) ────────────────────────────

export type PaymentMethod = "cod" | "online" | "upi_qr";

/**
 * Payment summary on every order group. For `upi_qr` the platform never sees the
 * money: `payerReference` / `reportedAt` are what the PATIENT reported (unverified)
 * and the order stays `pending` until the pharmacy marks it received.
 */
export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  payerReference: string | null;
  reportedAt: string | null;
}

/** The pharmacy's own UPI QR (GET/PUT /medicine/pharmacy/payment-qr). */
export interface PaymentQr {
  upiId: string | null;
  payeeName: string | null;
  qrImageUrl: string | null;
  isActive: boolean;
  updatedAt: string | null;
  /** isActive && has an image — only then is it offered to patients. */
  configured: boolean;
}

/** A paginated list keyed by its collection name, e.g. Page<"orders", OrderGroup>. */
export type Page<K extends string, T> = Record<K, T[]> & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** One medicine line of an order group, with the price / tax snapshot taken at checkout. */
export interface OrderLine {
  id: number;
  medicineId: number;
  medicineName: string | null;
  strength: string | null;
  medicineType: string | null;
  packSize: string | null;
  imageUrl: string | null;
  quantity: number;
  returnedQuantity: number;
  unitPrice: number;
  mrp: number | null;
  discountPercent: number;
  discountAmount: number;
  gstRate: number;
  /** null on orders placed before GST data was recorded. */
  taxableAmount: number | null;
  gstAmount: number;
  hsnCode: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  lineTotal: number;
  /** Pharmacy-only: buying price per unit at the time of sale. */
  unitCost?: number | null;
  status: OrderStatus;
}

export interface CreditNoteRef {
  id: number;
  creditNoteNumber: string;
  refundAmount: number;
  restocked: boolean;
  createdAt: string;
}

/** One checkout against this pharmacy — the order header the bill is rendered from. */
export interface OrderGroup {
  id: number;
  orderNumber: string;
  patientId: number;
  providerId: number;
  providerType: ProviderType;
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxableTotal: number | null;
  gstTotal: number;
  totalAmount: number;
  refundedTotal: number;
  returns: CreditNoteRef[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  payment: OrderPayment;
  status: OrderStatus;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPincode: string | null;
  notes: string | null;
  prescriptionRequestId: number | null;
  placedAt: string | null;
  createdAt: string;
  provider: { id: number; name: string; role: string; phone: string | null; city: string | null; state: string | null } | null;
  patient: { id: number; name: string; phone: string | null } | null;
  items: OrderLine[];
}

export interface StoreDetails {
  name: string;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  drugLicenseNumber: string | null;
  invoiceNote: string | null;
}

export interface GstRow {
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
}

export interface InvoiceLine {
  medicineName: string | null;
  strength: string | null;
  packSize: string | null;
  hsnCode: string | null;
  batches: Array<{ batchNumber: string | null; expiryDate: string | null; quantity: number }>;
  quantity: number;
  returnedQuantity: number;
  mrp: number | null;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  gstRate: number;
  taxableAmount: number | null;
  gstAmount: number;
  lineTotal: number;
}

export interface Invoice {
  invoiceNumber: string;
  issuedAt: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  patient: { id: number; name: string; phone: string | null } | null;
  provider: OrderGroup["provider"];
  store: StoreDetails | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPincode: string | null;
  prescriptionRequestId: number | null;
  lines: InvoiceLine[];
  subtotal: number;
  discountTotal: number;
  taxableTotal: number | null;
  gstTotal: number;
  gstRecorded: boolean;
  gstSummary: GstRow[];
  total: number;
  returns: CreditNoteRef[];
  refundedTotal: number;
  netAfterReturns: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  payment: { status: string; gateway: string; reference: string | null; paidAt: string | null; simulated: boolean } | null;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  isActive: boolean;
  purchaseCount?: number;
  purchaseValue?: number;
  lastPurchaseDate?: string | null;
}

export interface PurchaseItem {
  id: number;
  inventoryId: number | null;
  batchId: number | null;
  medicineName: string;
  batchNumber: string | null;
  expiryDate: string | null;
  quantity: number;
  freeQuantity: number;
  buyingPrice: number;
  mrp: number | null;
  sellingPrice: number | null;
  gstRate: number;
  discountPercent: number;
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  lineTotal: number;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number | null;
  supplier?: { id: number; name: string; phone?: string | null; gstin?: string | null } | null;
  invoiceNumber: string;
  invoiceDate: string;
  status: "received" | "cancelled";
  cancelledAt: string | null;
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  gstTotal: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  items?: PurchaseItem[];
}

export type StockMovementType =
  | "opening"
  | "purchase"
  | "purchase_cancel"
  | "sale"
  | "sale_reversal"
  | "return"
  | "adjustment"
  | "import"
  | "expiry_writeoff";

export interface StockMovement {
  id: number;
  movementType: StockMovementType;
  quantity: number;
  stockAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  actor: string | null;
  batch: { id: number; batchNumber: string; expiryDate: string | null } | null;
  createdAt: string;
}

/** A batch across the whole inventory (the Stock & Expiry page). */
export interface BatchRow extends StockBatch {
  inventoryId: number;
  inventory: { id: number; medicineName: string; strength: string | null; medicineType: string; price: Money; buyingPrice: Money | null; isActive: boolean };
  daysToExpiry: number | null;
  stockValue: number | null;
}

export interface CreditNote {
  id: number;
  creditNoteNumber: string;
  orderGroupId: number;
  orderNumber: string | null;
  patient: { id: number; name: string; phone: string | null } | null;
  reason: string | null;
  restocked: boolean;
  itemCount: number;
  taxableTotal: number;
  gstTotal: number;
  refundAmount: number;
  createdAt: string;
  items: Array<{ id: number; orderLineId: number; medicineName: string; quantity: number; unitPrice: number; gstRate: number; taxableAmount: number; gstAmount: number; lineTotal: number }>;
  gstSummary?: GstRow[];
  store?: StoreDetails | null;
}

export interface PaymentRecord {
  id: number;
  orderGroupId: number;
  orderNumber: string | null;
  orderStatus: OrderStatus | null;
  patientName: string | null;
  amount: number;
  method: PaymentMethod;
  status: "pending" | "success" | "failed";
  gateway: string;
  simulated: boolean;
  reference: string | null;
  /** UPI reference the patient reported for a upi_qr payment (unverified). */
  payerReference: string | null;
  payerReportedAt: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export type ImportAction = "create" | "add" | "update" | "restore" | "skip" | "error";

export interface ImportRow {
  row: number;
  medicineName: string;
  strength: string | null;
  batchNumber: string | null;
  quantity: number | null;
  action: ImportAction;
  status: "valid" | "warning" | "error";
  messages: string[];
  result?: "imported" | "skipped" | "failed";
}

export interface ImportPreview {
  summary: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
    toCreate: number;
    toUpdate: number;
    toSkip: number;
    newCatalogueMedicines: number;
    newSuppliers: number;
  };
  rows: ImportRow[];
  duplicateStrategy: "skip" | "update";
  fileName: string | null;
}

export interface ImportResult {
  summary: {
    totalRows: number;
    imported: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    warnings: number;
    newCatalogueMedicines: number;
    newSuppliers: number;
  };
  rows: ImportRow[];
  duplicateStrategy: "skip" | "update";
  fileName: string;
  importedAt: string;
}

export interface InventorySummary {
  totalMedicines: number;
  activeMedicines: number;
  outOfStock: number;
  lowStock: number;
  totalUnits: number;
  stockValueAtCost: number;
  itemsWithoutCost: number;
  stockValueAtSale: number;
  expiredBatches: number;
  expiredUnits: number;
  expiringBatches: number;
  expiringUnits: number;
  expiryAlertDays: number;
}

export interface PharmacyDashboard {
  cards: InventorySummary & {
    todayOrders: number;
    todaySales: number;
    pendingOrders: number;
    pendingPrescriptions: number;
    unreadNotifications: number;
  };
  recentOrders: OrderGroup[];
  recentPurchases: Purchase[];
  lowStockMedicines: Medicine[];
  expiringBatches: BatchRow[];
}

export type ReportGroupBy = "day" | "week" | "month";

export interface SalesReport {
  from: string;
  to: string;
  groupBy: ReportGroupBy;
  series: Array<{ bucket: string; orders: number; gross: number; discount: number; net: number; taxable: number; gst: number; refunds: number }>;
  totals: { orders: number; gross: number; discount: number; net: number; taxable: number; gst: number; refunds: number; netAfterRefunds: number; averageOrderValue: number };
  byOrderStatus: Array<{ status: OrderStatus; orders: number; amount: number }>;
  byPaymentStatus: Array<{ paymentStatus: PaymentStatus; orders: number; amount: number }>;
  byPaymentMethod: Array<{ paymentMethod: PaymentMethod; orders: number; amount: number }>;
  grossMargin: { revenueExGst: number; cost: number; grossMargin: number; marginPercent: number | null; costedLines: number; totalLines: number; note: string };
}

export interface TopMedicinesReport {
  from: string;
  to: string;
  medicines: Array<{ medicineId: number; medicineName: string; strength: string | null; medicineType: string; units: number; orders: number; revenue: number; grossMargin: number | null }>;
}

export interface PurchaseReport {
  from: string;
  to: string;
  groupBy: ReportGroupBy;
  series: Array<{ bucket: string; purchases: number; gross: number; discount: number; taxable: number; gst: number; total: number }>;
  totals: { purchases: number; gross: number; discount: number; taxable: number; gst: number; total: number };
  bySupplier: Array<{ supplierId: number | null; supplierName: string; purchases: number; total: number }>;
}

export interface GstReport {
  from: string;
  to: string;
  output: Array<{ gstRate: number; taxable: number; gst: number }>;
  returns: Array<{ gstRate: number; taxable: number; gst: number }>;
  input: Array<{ gstRate: number; taxable: number; gst: number }>;
  totals: { outputTaxable: number; outputGst: number; returnTaxable: number; returnGst: number; inputTaxable: number; inputGst: number; netGst: number };
  linesWithoutGstData: { lines: number; amount: number };
  note: string;
}

export interface StockReport {
  summary: InventorySummary;
  byCategory: Array<{ categoryId: number | null; category: string; medicines: number; units: number; outOfStock: number; lowStock: number; valueAtCost: number; valueAtSale: number }>;
}

export interface PharmacyStoreSettings extends StoreDetails {
  id: number;
  role: string;
  expiryAlertDays: number;
}

/** GET /medicine/pharmacy/dashboard/analytics — one payload for every dashboard chart. */
export interface DashboardAnalytics {
  range: { from: string; to: string; groupBy: ReportGroupBy; previousFrom: string; previousTo: string };
  sales: {
    series: SalesReport["series"];
    totals: SalesReport["totals"];
    previous: { orders: number; net: number };
    thisMonth: { orders: number; net: number };
    byPaymentMethod: SalesReport["byPaymentMethod"];
    byPaymentStatus: SalesReport["byPaymentStatus"];
    byOrderStatus: SalesReport["byOrderStatus"];
    grossMargin: SalesReport["grossMargin"];
    unconfirmedPayments: { orders: number; amount: number };
  };
  purchases: {
    series: PurchaseReport["series"];
    totals: PurchaseReport["totals"];
    today: { purchases: number; total: number };
    thisMonth: { purchases: number; total: number };
    bySupplier: PurchaseReport["bySupplier"];
  };
  topMedicines: TopMedicinesReport["medicines"];
  movers: {
    windowDays: number;
    fast: Array<{ id: number; medicineName: string; strength: string | null; units: number; stock: number; minStock: number; daysOfCover: number | null; reorderSuggested: boolean }>;
    slow: Array<{ id: number; medicineName: string; strength: string | null; stock: number; valueAtSale: number }>;
    nonMoving: { items: number; valueAtSale: number };
  };
  inventoryHealth: { healthy: number; low: number; out: number; activeMedicines: number };
  expiry: Array<{ key: string; label: string; batches: number; units: number }>;
  recentStockMovements: Array<{
    id: number;
    movementType: StockMovementType;
    quantity: number;
    stockAfter: number;
    referenceType: string | null;
    referenceId: number | null;
    createdAt: string;
    inventoryId: number;
    medicineName: string | null;
    strength: string | null;
    batchNumber: string | null;
  }>;
  expiryAlertDays: number;
  notTracked: string[];
}
