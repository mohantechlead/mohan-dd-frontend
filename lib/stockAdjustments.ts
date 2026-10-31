export const STOCK_ADJUSTMENTS_URL = "/api/inventory/stock/adjustments";

export const STOCK_ADJUSTMENT_APPROVE_URL = (adjustmentId: number) =>
  `${STOCK_ADJUSTMENTS_URL}/${adjustmentId}/approve`;

export const STOCK_ADJUSTMENT_REJECT_URL = (adjustmentId: number) =>
  `${STOCK_ADJUSTMENTS_URL}/${adjustmentId}/reject`;

export interface StockAdjustment {
  id: number;
  code: string;
  item_name: string;
  quantity: number;
  bags?: number | null;
  unit_measurement?: string | null;
  reason: "lost" | "contaminated" | string;
  note?: string | null;
  date: string;
  status: "pending" | "approved" | "rejected" | string;
  adjusted_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_remark?: string | null;
  created_at?: string | null;
}

export function reasonLabel(reason: string): string {
  if (reason === "lost") return "Lost";
  if (reason === "contaminated") return "Contaminated";
  return reason;
}

export function formatAdjustmentDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}
