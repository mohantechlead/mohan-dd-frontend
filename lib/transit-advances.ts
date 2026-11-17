/** Transit advance: the transitor's request to move to the next stage. */

export type TransitAdvanceStatus = "pending" | "approved" | "rejected";

export interface TransitAdvance {
  id: string;
  purchase_number: string;
  /** Stage being asked for, e.g. "transit_permit". No money is involved. */
  target_stage?: string | null;
  target_stage_label?: string | null;
  status: TransitAdvanceStatus;
  status_label?: string | null;
  requested_by?: string | null;
  requested_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_remark?: string | null;
}

/** Purchase summary embedded in the admin review payload. */
export interface TransitAdvancePurchase {
  id: string;
  purchase_number: string;
  order_date: string;
  buyer?: string | null;
  buyer_address?: string | null;
  shipper?: string | null;
  proforma_ref_no?: string | null;
  status?: string | null;
  stage?: string | null;
  stage_label?: string | null;
  stage_updated_at?: string | null;
  stage_updated_by?: string | null;
  assigned_transitor?: string | null;
  country_of_origin?: string | null;
  final_destination?: string | null;
  port_of_loading?: string | null;
  port_of_discharge?: string | null;
  mode_of_transport?: string | null;
  shipment_type?: string | null;
  before_vat?: number;
  total_quantity?: number;
  bill_of_lading?: {
    bl_number: string;
    bl_date?: string | null;
    container_count?: number;
    shipping_company_name?: string | null;
    vessel_name?: string | null;
  } | null;
  transit_documents?: Array<{
    id: string;
    document_type: string;
    reference_number: string;
    document_date: string;
  }>;
  items?: Array<{
    item_id?: string;
    item_name?: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
  }>;
  advance?: TransitAdvance | null;
}

/** What the admin inbox returns per row. */
export interface TransitAdvanceDetail {
  advance: TransitAdvance;
  purchase: TransitAdvancePurchase;
}

export const TRANSIT_ADVANCES_URL = "/api/transit-advances";
export const TRANSIT_ADVANCE_APPROVE_URL = (id: string) =>
  `${TRANSIT_ADVANCES_URL}/${encodeURIComponent(id)}/approve`;
export const TRANSIT_ADVANCE_REJECT_URL = (id: string) =>
  `${TRANSIT_ADVANCES_URL}/${encodeURIComponent(id)}/reject`;

export function purchaseAdvanceUrl(purchaseNumber: string): string {
  return `/api/purchases/${encodeURIComponent(purchaseNumber)}/advance`;
}

export const TRANSIT_ADVANCE_STATUS_LABELS: Record<
  TransitAdvanceStatus,
  string
> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function transitAdvanceStatusLabel(
  status?: string | null,
  fallback?: string | null
): string {
  if (status && status in TRANSIT_ADVANCE_STATUS_LABELS) {
    return TRANSIT_ADVANCE_STATUS_LABELS[status as TransitAdvanceStatus];
  }
  return fallback || (status ? status : "—");
}

/** Tailwind classes for a status pill, matching the approvals pages. */
export function transitAdvanceStatusClass(status?: string | null): string {
  if (status === "approved") {
    return "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800";
  }
  if (status === "rejected") {
    return "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800";
  }
  return "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800";
}

export function formatAdvanceDate(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
