import { parseInventoryItemsJson } from "@/lib/parseInventoryItems";

/** Normalize list API JSON: plain array or `{ results: [...] }`. */
export function parseListResponse(data: unknown): Record<string, unknown>[] {
  let raw: unknown[] = [];
  if (Array.isArray(data)) raw = data;
  else if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { results?: unknown[] }).results)
  ) {
    raw = (data as { results: unknown[] }).results;
  }
  return raw.map((r) =>
    typeof r === "object" && r !== null ? (r as Record<string, unknown>) : {}
  );
}

export async function fetchDisplayValueSet(
  url: string,
  displayKey: string
): Promise<Set<string>> {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  const rows = parseListResponse(data);
  const set = new Set<string>();
  for (const row of rows) {
    const v = String(row[displayKey] ?? "").trim();
    if (v) set.add(v);
  }
  return set;
}

export async function fetchInventoryItemNameSet(): Promise<Set<string>> {
  const res = await fetch("/api/inventory/items", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  const items = parseInventoryItemsJson(data);
  return new Set(items.map((i) => i.item_name));
}

export function isInSet(value: string | undefined | null, allowed: Set<string>): boolean {
  const v = String(value ?? "").trim();
  if (!v) return false;
  return allowed.has(v);
}

export type ValidateLineItemsResult =
  | { ok: true }
  | { ok: false; title: string; description: string };

/** Ensures every line’s `item_name` exists in GET /api/inventory/items (same source as item dropdowns). */
export async function validateLineItemsAgainstInventory(
  items: { item_name?: string | null }[],
  context: "purchase" | "sales"
): Promise<ValidateLineItemsResult> {
  let set: Set<string>;
  try {
    set = await fetchInventoryItemNameSet();
  } catch {
    return {
      ok: false,
      title: "Could not verify items",
      description: "Please check your connection and try again.",
    };
  }
  const docLabel = context === "purchase" ? "purchase" : "order";
  for (const it of items) {
    const nm = String(it.item_name ?? "").trim();
    if (!nm) {
      return {
        ok: false,
        title: "Invalid item line",
        description: `Each ${docLabel} line must use an item selected from the inventory list.`,
      };
    }
    if (!set.has(nm)) {
      return {
        ok: false,
        title: "Invalid item",
        description: `"${nm}" is not in the inventory list. Select each line from the item dropdown.`,
      };
    }
  }
  return { ok: true };
}
