/**
 * Balance helpers for installment-style schedules (received payments, vendor payments).
 * Pending amounts count toward reducing remaining; cancelled/rejected do not.
 */
/** Amounts that reduce balance owed on the order (include pending; exclude voided). */
export function statusCountsTowardRemaining(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s !== "cancelled" && s !== "rejected";
}

export function sumPaymentsTowardRemaining<T extends { amount: unknown; status?: string }>(
  payments: Iterable<T>
): number {
  let sum = 0;
  for (const p of payments) {
    if (statusCountsTowardRemaining(p.status)) sum += Number(p.amount ?? 0);
  }
  return sum;
}

export function sortReceivedPaymentsChronologically<
  T extends {
    payment_date?: string;
    installment_number?: number;
    payment_number?: string;
    id?: string;
  }
>(payments: T[]): T[] {
  return [...payments].sort((a, b) => {
    const ta = new Date(a.payment_date ?? "").getTime();
    const tb = new Date(b.payment_date ?? "").getTime();
    if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta - tb;
    const ia = a.installment_number ?? 0;
    const ib = b.installment_number ?? 0;
    if (ia !== ib) return ia - ib;
    const pa = a.payment_number ?? "";
    const pb = b.payment_number ?? "";
    if (pa !== pb) return pa.localeCompare(pb);
    return (a.id ?? "").localeCompare(b.id ?? "");
  });
}

/** Newest row with a positive order_total wins (list payloads often repeat the same total). */
export function resolveOrderTotalFromPayments<T extends { order_total?: number }>(
  sortedOldestToNewest: T[]
): number {
  for (let i = sortedOldestToNewest.length - 1; i >= 0; i--) {
    const v = Number(sortedOldestToNewest[i]?.order_total ?? 0);
    if (v > 0) return v;
  }
  return 0;
}

/** Newest row with a positive purchase_total (vendor schedules mirror received-payment order totals). */
export function resolvePurchaseTotalFromPayments<T extends { purchase_total?: number }>(
  sortedOldestToNewest: T[]
): number {
  for (let i = sortedOldestToNewest.length - 1; i >= 0; i--) {
    const v = Number(sortedOldestToNewest[i]?.purchase_total ?? 0);
    if (v > 0) return v;
  }
  return 0;
}
