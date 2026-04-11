import { parseInventoryItemsJson, type InventoryItemOption } from "@/lib/parseInventoryItems";
import { parseDecimalQuantity } from "@/lib/inventoryQuantity";

export type GrnDnLineInput = {
  item_id?: string;
  code?: string;
  item_name: string;
  quantity: number | string;
  unit_measurement: string;
  bags: number | string;
  internal_code?: string;
};

export type GrnDnLinePayload = {
  item_id?: string;
  code?: string;
  item_name: string;
  quantity: number;
  unit_measurement: string;
  bags: string;
  internal_code: string;
};

/**
 * Re-fetch inventory and rebuild each line from the canonical row (by item_id, else exact item_name).
 * Keeps the user-entered `code` separate from inventory `internal_code`.
 */
export async function resolveGrnDnLinesFromInventory(
  items: GrnDnLineInput[]
): Promise<{ ok: true; lines: GrnDnLinePayload[] } | { ok: false; message: string }> {
  const res = await fetch("/api/inventory/items", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    return { ok: false, message: "Could not load inventory items to verify lines." };
  }
  const parsed = parseInventoryItemsJson(await res.json());
  const byId = new Map<string, InventoryItemOption>();
  const byName = new Map<string, InventoryItemOption>();
  for (const row of parsed) {
    if (row.item_id) byId.set(String(row.item_id), row);
    byName.set(row.item_name, row);
  }

  const lines: GrnDnLinePayload[] = [];
  for (const it of items) {
    const id = String(it.item_id ?? "").trim();
    let row: InventoryItemOption | undefined;
    if (id && byId.has(id)) {
      row = byId.get(id);
    } else {
      const nm = String(it.item_name ?? "").trim();
      row = byName.get(nm);
    }
    if (!row) {
      const label = String(it.item_name ?? "").trim() || id || "Unknown";
      return {
        ok: false,
        message: `Item "${label}" does not match the inventory list. Re-select it from the item dropdown.`,
      };
    }
    const internal =
      row.internal_code != null && String(row.internal_code).trim() !== ""
        ? String(row.internal_code).trim()
        : "";
    const enteredCode = String(it.code ?? "").trim();
    const qty = parseDecimalQuantity(it.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      const label = String(it.item_name ?? "").trim() || id || "Unknown";
      return {
        ok: false,
        message: `Enter a valid quantity greater than zero for "${label}".`,
      };
    }
    const out: GrnDnLinePayload = {
      code: enteredCode,
      item_name: row.item_name,
      quantity: qty,
      unit_measurement: String(it.unit_measurement ?? ""),
      bags: String(it.bags ?? ""),
      internal_code: internal,
    };
    if (row.item_id) {
      out.item_id = row.item_id;
    }
    lines.push(out);
  }
  return { ok: true, lines };
}
