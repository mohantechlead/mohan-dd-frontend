export type TransitDocumentType =
  | "container_guarantee"
  | "letter_guarantee"
  | "closure_guarantee";

export interface TransitDocumentContainer {
  container_number: string;
  size: string;
  cargo_type?: string | null;
}

export interface TransitDocumentSnapshot {
  purchase_number?: string | null;
  buyer?: string | null;
  shipper?: string | null;
  proforma_ref_no?: string | null;
  bl_number?: string | null;
  bl_date?: string | null;
  shipping_company_name?: string | null;
  vessel_name?: string | null;
  container_count?: number | null;
  container_size_summary?: string | null;
  containers?: TransitDocumentContainer[];
  port_of_loading?: string | null;
  port_of_discharge?: string | null;
  final_destination?: string | null;
  declaration_number?: string | null;
  declaration_date?: string | null;
  customs_value?: number | null;
  duty_value?: number | null;
  return_days?: number | null;
  previous_letter_reference?: string | null;
  previous_letter_date?: string | null;
}

export interface TransitDocument {
  id: string;
  document_type: TransitDocumentType;
  document_type_label?: string | null;
  reference_number: string;
  document_date: string;
  snapshot: TransitDocumentSnapshot;
  created_at?: string | null;
}

export const TRANSIT_DOCUMENT_LABELS: Record<TransitDocumentType, string> = {
  container_guarantee: "Container Guarantee",
  letter_guarantee: "Letter of Guarantee",
  closure_guarantee: "Closure of Guarantee Letter",
};

/** Letters produced when a purchase enters each checkpoint. */
export const TRANSIT_DOCUMENTS_FOR_STAGE: Partial<
  Record<string, TransitDocumentType[]>
> = {
  // Printed as separate jobs: the letter first, then the container guarantee
  // (which includes its container-details annex page).
  transit_permit: ["letter_guarantee", "container_guarantee"],
  closure_guarantee: ["closure_guarantee"],
};

export function transitDocumentLabel(type: string): string {
  return (
    TRANSIT_DOCUMENT_LABELS[type as TransitDocumentType] ??
    type.replaceAll("_", " ")
  );
}

const ORDINAL_SUFFIXES = ["th", "st", "nd", "rd"];

export function formatOrdinalDate(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  const day = parsed.getDate();
  const suffix =
    day % 100 >= 11 && day % 100 <= 13
      ? "th"
      : ORDINAL_SUFFIXES[day % 10] ?? "th";
  const month = parsed.toLocaleDateString("en-GB", { month: "long" });
  return `${day}${suffix} ${month} ${parsed.getFullYear()}`;
}

export function formatGuaranteeMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function containerNumberList(
  containers?: TransitDocumentContainer[] | null
): string {
  return (containers ?? [])
    .map((container) => container.container_number?.trim())
    .filter(Boolean)
    .join(", ");
}

export function guaranteePrintUrl(
  purchaseNumber: string,
  types: TransitDocumentType[],
  auto = true
): string {
  const params = new URLSearchParams({
    types: types.join(","),
  });
  if (auto) params.set("auto", "1");
  return `/diredawa/purchase/${encodeURIComponent(
    purchaseNumber
  )}/guarantee/print?${params.toString()}`;
}
