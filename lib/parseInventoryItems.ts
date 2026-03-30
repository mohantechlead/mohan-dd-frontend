export type InventoryItemOption = {
  item_id: string | null;
  item_name: string;
  hscode: string;
  internal_code: string | null;
};

/** Normalize GET /api/inventory/items JSON (array or paginated `{ results }`) into a safe list. */
export function parseInventoryItemsJson(data: unknown): InventoryItemOption[] {
  let raw: unknown[] = [];
  if (Array.isArray(data)) raw = data;
  else if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { results?: unknown[] }).results)
  ) {
    raw = (data as { results: unknown[] }).results;
  }
  return raw
    .map((row) => {
      const o = row as Record<string, unknown>;
      return {
        item_id:
          o.item_id != null && o.item_id !== "" ? String(o.item_id) : null,
        item_name: String(o.item_name ?? "").trim(),
        hscode: String(o.hscode ?? ""),
        internal_code:
          o.internal_code != null && o.internal_code !== ""
            ? String(o.internal_code)
            : null,
      };
    })
    .filter((x) => x.item_name.length > 0);
}
