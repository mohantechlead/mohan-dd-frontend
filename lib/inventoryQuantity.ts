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

/** Avoid float noise when showing sums or stored totals. */
export function formatQuantityDisplay(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const r = Math.round(x * 1e6) / 1e6;
  return String(r);
}
