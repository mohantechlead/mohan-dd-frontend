/**
 * GIT variance in MT: when the GRN line is saved in KG, received quantity is ÷ 1000
 * before subtracting PO quantity (MT). Unit may come from the GIT payload or from the GRN list.
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
  /** If API sends GRN line unit on GIT row */
  unit_measurement?: string | null;
  grn_unit_measurement?: string | null;
  unit?: string | null;
};

export type GITDisplayRow = GITRow & {
  received_quantity_mt: number;
  purchase_quantity_mt: number;
  variance_quantity_mt: number;
  variance_type_mt: "increased" | "decreased";
  grn_kg_converted_to_mt: boolean;
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

/** Match key: GRN no + item name + code (lowercase) for merging GRN line unit onto GIT rows. */
export function gitRowLookupKey(row: {
  grn_no: string;
  item_name: string;
  code?: string | null;
}): string {
  const grn = String(row.grn_no ?? "").trim().toLowerCase();
  const name = String(row.item_name ?? "").trim().toLowerCase();
  const code = String(row.code ?? "").trim().toLowerCase();
  return `${grn}|${name}|${code}`;
}

type GrnItemLike = {
  item_name?: string | null;
  code?: string | null;
  internal_code?: string | null;
  unit_measurement?: string | null;
};

type GrnListRowLike = {
  grn_no?: string | number | null;
  items?: GrnItemLike[] | null;
};

/**
 * Build a map GRN-line-key → unit_measurement from GET /api/inventory/grn list
 * so GIT rows can resolve KG even when GIT API omits unit.
 */
export function buildGitUnitLookupFromGrnList(raw: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (!Array.isArray(raw)) return map;
  for (const grn of raw as GrnListRowLike[]) {
    const grnNo = String(grn.grn_no ?? "").trim();
    if (!grnNo) continue;
    const items = Array.isArray(grn.items) ? grn.items : [];
    for (const it of items) {
      const name = String(it.item_name ?? "").trim();
      if (!name) continue;
      const code = String(it.code ?? it.internal_code ?? "").trim();
      const unit = String(it.unit_measurement ?? "").trim();
      if (!unit) continue;
      const key = `${grnNo.toLowerCase()}|${name.toLowerCase()}|${code.toLowerCase()}`;
      map.set(key, unit);
      const keyNoCode = `${grnNo.toLowerCase()}|${name.toLowerCase()}|`;
      if (!map.has(keyNoCode)) map.set(keyNoCode, unit);
    }
  }
  return map;
}

function pickGrnUnitFromRow(row: GITRow): string {
  const r = row as GITRow & Record<string, unknown>;
  const keys = [
    "unit_measurement",
    "grn_unit_measurement",
    "unit",
    "unit_of_measurement",
    "measurement_unit",
    "grn_line_unit",
  ] as const;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function resolveGrnUnit(row: GITRow, grnUnitLookup?: Map<string, string>): string {
  const direct = pickGrnUnitFromRow(row);
  if (direct) return direct;
  if (!grnUnitLookup?.size) return "";
  const full = gitRowLookupKey(row);
  const hit = grnUnitLookup.get(full) ?? grnUnitLookup.get(`${String(row.grn_no).trim().toLowerCase()}|${String(row.item_name).trim().toLowerCase()}|`);
  return hit?.trim() ?? "";
}

function varianceTypeFromSign(delta: number): "increased" | "decreased" {
  if (delta > 0) return "increased";
  return "decreased";
}

/**
 * received (MT) = received_quantity ÷ 1000 when GRN line unit is KG, else as-is (MT).
 * variance (MT) = received_mt − purchase_quantity (PO treated as MT).
 */
export function buildGitDisplayRow(
  row: GITRow,
  grnUnitLookup?: Map<string, string>,
): GITDisplayRow {
  const unit = resolveGrnUnit(row, grnUnitLookup);
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
