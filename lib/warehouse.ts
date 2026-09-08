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

export interface WarehouseStorageEntryItem {
  id?: number;
  storage_item_id: number;
  item_name: string;
  code?: string | null;
  quantity: number;
  bags?: number | null;
}

export interface WarehouseStorageEntry {
  id: string;
  entry_date: string;
  remark?: string | null;
  items: WarehouseStorageEntryItem[];
  created_at?: string | null;
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
  price_entered_by?: string | null;
  price_entered_at?: string | null;
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
  entries: WarehouseStorageEntry[];
  total_entry_quantity: number;
  total_paid: number;
  payment_remaining: number;
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

// ============================================================
// Warehouse Storage Payments
// ============================================================

export interface WarehouseStoragePayment {
  id: string;
  payment_number: string;
  installment_number: number;
  payment_date: string;
  wsn_no: string;
  customer_name: string;
  payment_type: string;
  amount: number;
  status: string;
  approved_by?: string | null;
  approval_date?: string | null;
  completed_by?: string | null;
  completed_date?: string | null;
  cancelled_by?: string | null;
  cancelled_date?: string | null;
  reference_number?: string | null;
  status_remark?: string | null;
  storage_price: number;
  total_paid: number;
  remaining_amount: number;
  payment_completion_status: string;
  remark?: string | null;
}

// ============================================================
// Warehouse Item Flow
// ============================================================

export interface WarehouseItemFlowEntry {
  entry_id: string;
  entry_date: string;
  item_name: string;
  code?: string | null;
  quantity: number;
  bags?: number | null;
}

export interface WarehouseItemFlowRelease {
  wrn_no: string;
  release_date: string;
  item_name: string;
  code?: string | null;
  quantity: number;
  bags?: number | null;
}

export interface WarehouseItemFlowPayment {
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_type: string;
  status: string;
}

export interface WarehouseItemFlow {
  wsn_no: string;
  customer_name: string;
  contract_date: string;
  storage_price: number;
  total_agreed_quantity: number;
  total_entry_quantity: number;
  total_released_quantity: number;
  remaining_quantity: number;
  entries: WarehouseItemFlowEntry[];
  releases: WarehouseItemFlowRelease[];
  payments: WarehouseItemFlowPayment[];
  total_paid: number;
  payment_remaining: number;
}

// ============================================================
// Warehouse Item Inventory
// ============================================================

export interface WarehouseItemInventoryNote {
  wsn_no: string;
  customer_name: string;
  contract_date: string;
  total_quantity: number;
  entered_quantity: number;
  released_quantity: number;
  remaining_quantity: number;
}

export interface WarehouseItemInventory {
  item_name: string;
  code?: string | null;
  internal_code?: string | null;
  total_stored: number;
  total_released: number;
  remaining: number;
  storage_notes: WarehouseItemInventoryNote[];
}

export const PERIOD_UNITS = ["days", "weeks", "months"] as const;

export const WSN_API_URL = "/api/inventory/warehouse-storage-notes";
export const WRN_API_URL = "/api/inventory/warehouse-release-notes";
export const EXPIRY_CHECK_URL = "/api/inventory/warehouse-expiry-check";
export const WSN_NEXT_NUMBER_URL = `${WSN_API_URL}/next-number`;
export const WRN_NEXT_NUMBER_URL = `${WRN_API_URL}/next-number`;
export const WSN_ENTRIES_URL = (noteId: string) => `${WSN_API_URL}/${noteId}/entries`;
export const WSN_ENTRY_URL = (noteId: string, entryId: string) => `${WSN_API_URL}/${noteId}/entries/${entryId}`;
export const WSN_PRICE_URL = (noteId: string) => `${WSN_API_URL}/${noteId}/price`;
export const WSN_TIERS_URL = (noteId: string) => `${WSN_API_URL}/${noteId}/expiration-fee-tiers`;
export const WSN_FLOW_URL = (noteId: string) => `${WSN_API_URL}/${noteId}/flow`;
export const WSN_ITEM_INVENTORY_URL = `${WSN_API_URL.replace("/warehouse-storage-notes", "")}/warehouse-item-inventory`;
export const WSP_API_URL = "/api/accounting/warehouse-storage-payments";
export const WSP_NEXT_NUMBER_URL = `${WSP_API_URL}/next-number`;

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
