export interface WSNItem {
  item_id?: string;
  item_name: string;
  code?: string;
  quantity: number;
  unit_measurement?: string;
  internal_code?: string | null;
  bags?: number | null;
  remaining_quantity?: number;
}

export interface ExpirationFeeTier {
  id?: number;
  tier_index: number;
  period_value: number;
  period_unit: string;
  fee_amount: number;
}

export interface WSNTopUp {
  id?: number;
  top_up_date?: string;
  additional_period_value: number;
  additional_period_unit: string;
  price?: number;
  remark?: string | null;
}

export interface WarehouseStorageNote {
  id: string;
  wsn_no: string;
  customer_name: string;
  date?: string | null;
  ECD_no?: string | null;
  remark?: string | null;
  storage_period_value: number;
  storage_period_unit: string;
  storage_price: number;
  grace_period_value: number;
  grace_period_unit: string;
  status: string;
  is_active: boolean;
  storage_expiry_date?: string | null;
  current_expiry_date?: string | null;
  expired: boolean;
  periods_expired: number;
  current_expiration_fee: number | null;
  items: WSNItem[];
  expiration_fee_tiers: ExpirationFeeTier[];
  top_ups: WSNTopUp[];
}

export interface WRNItem {
  storage_item_id?: number | string;
  item_id?: string;
  item_name: string;
  code?: string;
  quantity: number;
  unit_measurement?: string;
  internal_code?: string | null;
  bags?: number | null;
}

export interface WarehouseReleaseNote {
  id: string;
  wrn_no: string;
  storage_note_id: string;
  wsn_no?: string;
  customer_name: string;
  date?: string | null;
  remark?: string | null;
  items: WRNItem[];
}

export const PERIOD_UNITS = ["days", "weeks", "months"] as const;

export const WSN_API_URL = "/api/inventory/warehouse-storage-notes";
export const WRN_API_URL = "/api/inventory/warehouse-release-notes";
export const EXPIRY_CHECK_URL = "/api/inventory/warehouse-expiry-check";

export function periodLabel(
  value: number | null | undefined,
  unit: string | null | undefined,
): string {
  const v = value ?? 0;
  const u = unit?.trim() ? unit.trim().toLowerCase() : "";
  if (!u) return `${v}`;
  return `${v} ${u}`;
}

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  return `${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
