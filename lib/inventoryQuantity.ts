import { formatExactNumber } from "@/lib/utils";

/**
 * Parse GRN/DN line quantities from controlled inputs (string) or API values.
 * Accepts "12.5" and "12,5" (comma as decimal separator when no period is used).
 */
export function parseDecimalQuantity(raw: unknown): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : NaN;
  }
  let s = String(raw ?? "").trim();
  if (!s) return NaN;
  if (s.includes(",") && !s.includes(".")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Format quantity/bags for display with thousands separators where appropriate. */
export function formatQuantityDisplay(
  n: number | string | null | undefined,
): string {
  if (n === null || n === undefined) return "—";

  if (typeof n === "string") {
    const trimmed = n.trim();
    if (!trimmed) return "—";
    const parsed = parseDecimalQuantity(trimmed);
    if (!Number.isFinite(parsed)) return trimmed;
    const rounded = Math.round(parsed * 1e6) / 1e6;
    return formatExactNumber(rounded);
  }

  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const rounded = Math.round(x * 1e6) / 1e6;
  return formatExactNumber(rounded);
}
