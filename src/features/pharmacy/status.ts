import type { ExpiryStatus, OrderStatus, PaymentMethod, PaymentStatus, StockMovementType, StockStatus } from "@/types";

type ChipColor = "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error";

/** Display names for the delivery lifecycle (the DB values are unchanged). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  processing: "Preparing",
  shipped: "Out for Delivery",
  on_the_way: "On the Way",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];

export const ORDER_STATUS_COLOR: Record<OrderStatus, ChipColor> = {
  pending: "warning",
  confirmed: "info",
  processing: "primary",
  shipped: "primary",
  on_the_way: "primary",
  delivered: "success",
  rejected: "error",
  cancelled: "default",
};

/**
 * Next allowed steps — mirrors the backend's MEDICINE_ORDER_TRANSITIONS, which
 * re-validates every change. UX only.
 */
export const ORDER_NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["confirmed", "rejected"],
  confirmed: ["processing"],
  processing: ["shipped"],
  shipped: ["on_the_way", "delivered"],
  on_the_way: ["delivered"],
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, ChipColor> = {
  pending: "warning",
  paid: "success",
  failed: "error",
  refunded: "default",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  online: "Online (simulated)",
  upi_qr: "UPI QR",
};

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = { in: "In stock", low: "Low stock", out: "Out of stock" };
export const STOCK_STATUS_COLOR: Record<StockStatus, ChipColor> = { in: "success", low: "warning", out: "error" };

export const EXPIRY_STATUS_LABEL: Record<ExpiryStatus, string> = { ok: "Valid", expiring: "Expiring soon", expired: "Expired" };
export const EXPIRY_STATUS_COLOR: Record<ExpiryStatus, ChipColor> = { ok: "success", expiring: "warning", expired: "error" };

export const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  opening: "Opening stock",
  purchase: "Purchase",
  purchase_cancel: "Purchase cancelled",
  sale: "Sale",
  sale_reversal: "Order cancelled / rejected",
  return: "Customer return",
  adjustment: "Manual adjustment",
  import: "Excel import",
  expiry_writeoff: "Expired — written off",
};

export const MEDICINE_TYPES = ["tablet", "capsule", "syrup", "injection", "drops", "cream", "ointment", "gel", "spray", "inhaler", "powder", "other"];

/** "tablet" → "Tablet". */
export const titleCase = (value: string | null | undefined) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");
