"use client";

import Chip, { type ChipProps } from "@mui/material/Chip";
import {
  EXPIRY_STATUS_COLOR,
  EXPIRY_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABEL,
  STOCK_STATUS_COLOR,
  STOCK_STATUS_LABEL,
} from "@/features/pharmacy/status";
import type { ExpiryStatus, OrderStatus, PaymentStatus, StockStatus } from "@/types";

type Size = ChipProps["size"];

export function StockChip({ status, size = "small" }: { status?: StockStatus; size?: Size }) {
  if (!status) return null;
  return <Chip size={size} label={STOCK_STATUS_LABEL[status]} color={STOCK_STATUS_COLOR[status]} variant={status === "in" ? "outlined" : "filled"} />;
}

export function ExpiryChip({ status, size = "small" }: { status?: ExpiryStatus | null; size?: Size }) {
  if (!status) return null;
  return <Chip size={size} label={EXPIRY_STATUS_LABEL[status]} color={EXPIRY_STATUS_COLOR[status]} variant={status === "ok" ? "outlined" : "filled"} />;
}

export function OrderStatusChip({ status, size = "small" }: { status: OrderStatus; size?: Size }) {
  return <Chip size={size} label={ORDER_STATUS_LABEL[status] ?? status} color={ORDER_STATUS_COLOR[status] ?? "default"} />;
}

export function PaymentChip({ status, size = "small" }: { status: PaymentStatus; size?: Size }) {
  return <Chip size={size} variant="outlined" label={PAYMENT_STATUS_LABEL[status] ?? status} color={PAYMENT_STATUS_COLOR[status] ?? "default"} />;
}
