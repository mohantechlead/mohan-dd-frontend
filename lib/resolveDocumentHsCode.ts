export type OrderLineForHs = {
  item_name: string;
  hs_code?: string | null;
};

export type InvoiceLineForHs = {
  item_name: string;
  hscode?: string | null;
  hs_code?: string | null;
};

function normalizeItemName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function findMatchingOrderLine<T extends OrderLineForHs>(
  orderItems: T[],
  invoiceLine: { item_name: string },
): T | undefined {
  const target = normalizeItemName(invoiceLine.item_name);
  if (!target) return undefined;
  return orderItems.find(
    (line) => normalizeItemName(line.item_name) === target,
  );
}

/** Prefer invoice line HS code, then matching order line. */
export function resolveDocumentHsCode(
  invoiceLine: InvoiceLineForHs,
  orderItems: OrderLineForHs[],
): string {
  const fromInvoice = (invoiceLine.hscode ?? invoiceLine.hs_code ?? "").trim();
  if (fromInvoice) return fromInvoice;
  const orderLine = findMatchingOrderLine(orderItems, invoiceLine);
  return (orderLine?.hs_code ?? "").trim();
}
