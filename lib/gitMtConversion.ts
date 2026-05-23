/**
 * GIT variance display: when GRN line unit is mass in KG, convert received qty to MT (÷ 1000)
 * before comparing to PO quantity (treated as MT).
 */

export type GITRow = {
  id: string;
  grn_no: string;
  purchase_no: string;
  item_name: string;
  code?: string | null;
  purchase_quantity: number;
  received_quantity: number;
  variance_quantity: number;
  variance_type: "increased" | "decreased";
  /** GRN line unit from API (e.g. KG, MT); drives KG→MT conversion for received qty */
  unit_measurement?: string | null;
  grn_unit_measurement?: string | null;
  unit?: string | null;
};

export type GITDisplayRow = GITRow & {
  /** Received quantity in MT for display / variance */
  received_quantity_mt: number;
  /** Purchase quantity in MT (same as API unless PO unit is added later) */
  purchase_quantity_mt: number;
  /** received_mt − purchase_mt */
  variance_quantity_mt: number;
  variance_type_mt: "increased" | "decreased";
  /** True when GRN unit was treated as KG and received was ÷ 1000 */
  grn_kg_converted_to_mt: boolean;
  /** Unit string used for conversion decision (for display) */
  grn_unit_label: string;
};

function normalizeUnit(u: string | null | undefined): string {
  return (u ?? "").trim().toUpperCase().replace(/\s+/g, " ");
}

/** True when GRN line is recorded in kilograms (mass). */
export function isGrnUnitKg(unit: string | null | undefined): boolean {
  const n = normalizeUnit(unit);
  if (!n) return false;
  if (n === "KG" || n === "KGS") return true;
  if (n.startsWith("KG")) return true;
  if (n.includes("KILOGRAM")) return true;
  return false;
}

function pickGrnUnit(row: GITRow): string {
  return (
    row.unit_measurement ??
    row.grn_unit_measurement ??
    row.unit ??
    ""
  );
}

function varianceTypeFromSign(delta: number): "increased" | "decreased" {
  if (delta > 0) return "increased";
  return "decreased";
}

/**
 * Build display row: if GRN unit is KG, received ÷ 1000 → MT; variance vs PO (MT).
 */
export function buildGitDisplayRow(row: GITRow): GITDisplayRow {
  const unit = pickGrnUnit(row);
  const grn_kg_converted_to_mt = isGrnUnitKg(unit);
  const receivedRaw = Number(row.received_quantity ?? 0);
  const purchaseMt = Number(row.purchase_quantity ?? 0);
  const receivedMt = grn_kg_converted_to_mt ? receivedRaw / 1000 : receivedRaw;
  const varianceMt = receivedMt - purchaseMt;
  const variance_type_mt = varianceTypeFromSign(varianceMt);

  return {
    ...row,
    received_quantity_mt: receivedMt,
    purchase_quantity_mt: purchaseMt,
    variance_quantity_mt: varianceMt,
    variance_type_mt,
    grn_kg_converted_to_mt,
    grn_unit_label: unit.trim() || "—",
  };
}
