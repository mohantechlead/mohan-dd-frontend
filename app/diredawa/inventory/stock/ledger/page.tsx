"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/authProvider";
import { Button } from "@/components/ui/button";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";

const STOCK_API_URL = "/api/inventory/stock";
const GRN_DETAIL_API_URL = "/api/inventory/grn";
const DN_DETAIL_API_URL = "/api/inventory/dn";

type StockItem = {
  item_name: string;
  code?: string;
  quantity: string;
  package: string;
  grn_nos?: string[];
  dn_nos?: string[];
};

type StockLedgerEntry = {
  type: "GRN" | "DN";
  documentNo: string;
  entryDate: string | null;
  quantity: number;
  bags: number;
  direction: 1 | -1;
  raw: number;
};

const parseNumericValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getMatchingItem = (
  items: Array<Record<string, unknown>>,
  selected: StockItem,
): Record<string, unknown> | null => {
  const selectedCode = (selected.code ?? "").trim().toLowerCase();
  const selectedName = selected.item_name.trim().toLowerCase();
  return (
    items.find((item) => {
      const rawCode = item.code ?? item.internal_code;
      const itemCode =
        typeof rawCode === "string" ? rawCode.trim().toLowerCase() : "";
      const itemName =
        typeof item.item_name === "string"
          ? item.item_name.trim().toLowerCase()
          : "";
      if (selectedCode && itemCode) return selectedCode === itemCode;
      return itemName === selectedName;
    }) ?? null
  );
};

export default function StockLedgerPage() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const code = (searchParams.get("code") ?? "").trim();
  const item = (searchParams.get("item") ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockItem, setStockItem] = useState<StockItem | null>(null);
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);

  useEffect(() => {
    if (!code && !item) {
      setError("Missing item reference. Please open this from stock list.");
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (code) params.set("code", code);
        if (item) params.set("item", item);
        const stockRes = await fetch(`${STOCK_API_URL}?${params.toString()}`, {
          credentials: "include",
        });

        if (stockRes.status === 401) {
          auth?.loginRequiredRedirect();
          return;
        }
        if (!stockRes.ok) {
          throw new Error("Failed to load stock item");
        }

        const stockData = (await stockRes.json()) as StockItem[];
        const matched =
          stockData.find((row) => {
            const rowCode = (row.code ?? "").trim().toLowerCase();
            const rowName = row.item_name.trim().toLowerCase();
            return code
              ? rowCode === code.toLowerCase()
              : rowName === item.toLowerCase();
          }) ?? null;

        if (!matched) {
          throw new Error("Stock item not found");
        }

        const grnEntriesPromise = Promise.all(
          (matched.grn_nos ?? []).map(async (docNo) => {
            const response = await fetch(
              `${GRN_DETAIL_API_URL}/${encodeURIComponent(docNo)}`,
              { credentials: "include" },
            );
            if (!response.ok) return null;
            const detail = (await response.json()) as Record<string, unknown>;
            const detailItems = Array.isArray(detail.items)
              ? (detail.items as Array<Record<string, unknown>>)
              : [];
            const matchedItem = getMatchingItem(detailItems, matched);
            const qty = parseNumericValue(matchedItem?.quantity);
            return {
              type: "GRN" as const,
              documentNo: docNo,
              entryDate:
                typeof detail.date === "string" && detail.date.trim() !== ""
                  ? detail.date
                  : null,
              quantity: qty,
              bags: parseNumericValue(matchedItem?.bags),
              direction: 1 as const,
              raw: qty,
            };
          }),
        );

        const dnEntriesPromise = Promise.all(
          (matched.dn_nos ?? []).map(async (docNo) => {
            const response = await fetch(
              `${DN_DETAIL_API_URL}/${encodeURIComponent(docNo)}`,
              { credentials: "include" },
            );
            if (!response.ok) return null;
            const detail = (await response.json()) as Record<string, unknown>;
            const detailItems = Array.isArray(detail.items)
              ? (detail.items as Array<Record<string, unknown>>)
              : [];
            const matchedItem = getMatchingItem(detailItems, matched);
            const qty = parseNumericValue(matchedItem?.quantity);
            return {
              type: "DN" as const,
              documentNo: docNo,
              entryDate:
                typeof detail.date === "string" && detail.date.trim() !== ""
                  ? detail.date
                  : null,
              quantity: qty,
              bags: parseNumericValue(matchedItem?.bags),
              direction: -1 as const,
              raw: -qty,
            };
          }),
        );

        const [grnEntries, dnEntries] = await Promise.all([
          grnEntriesPromise,
          dnEntriesPromise,
        ]);

        const merged: StockLedgerEntry[] = [...grnEntries, ...dnEntries]
          .filter((entry) => entry !== null)
          .sort((a, b) => {
            const at = a.entryDate ? new Date(a.entryDate).getTime() : 0;
            const bt = b.entryDate ? new Date(b.entryDate).getTime() : 0;
            return at - bt;
          });

        if (mounted) {
          setStockItem(matched);
          setEntries(merged);
        }
      } catch {
        if (mounted) {
          setError("Failed to load stock ledger.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [auth, code, item]);

  const entriesWithRunning = useMemo(() => {
    let runningQty = 0;
    return entries.map((entry) => {
      runningQty += entry.raw;
      return { ...entry, runningQty };
    });
  }, [entries]);

  const stats = useMemo(() => {
    const totalIn = entries
      .filter((entry) => entry.type === "GRN")
      .reduce((sum, entry) => sum + entry.quantity, 0);
    const totalOut = entries
      .filter((entry) => entry.type === "DN")
      .reduce((sum, entry) => sum + entry.quantity, 0);
    const currentBalance = totalIn - totalOut;
    return { totalIn, totalOut, currentBalance };
  }, [entries]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Ledger</h1>
          <p className="mt-1 text-sm text-blue-100">
            {stockItem
              ? `${stockItem.item_name}${stockItem.code ? ` (${stockItem.code})` : ""}`
              : "Selected stock item"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Total In</p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">
              {formatQuantityDisplay(stats.totalIn)}
            </p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Total Out</p>
            <p className="mt-1 text-lg font-semibold text-rose-700">
              {formatQuantityDisplay(stats.totalOut)}
            </p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Current Balance
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatQuantityDisplay(stats.currentBalance)}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="shadow-sm">
          <Link href="/diredawa/inventory/stock">Back to Stock</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading ledger...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        ) : entriesWithRunning.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No DN/GRN transactions found for this stock item.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Entry Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reference
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  In Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Out Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Balance Qty
                </th>
              </tr>
            </thead>
            <tbody>
              {entriesWithRunning.map((entry, index) => (
                <Fragment key={`${entry.type}-${entry.documentNo}-${index}`}>
                  <tr className="border-t transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.entryDate
                        ? new Date(entry.entryDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            entry.type === "GRN"
                              ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                              : "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                          }
                        >
                          {entry.type}
                        </span>
                        <span className="font-medium">{entry.documentNo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700">
                      {entry.type === "GRN"
                        ? formatQuantityDisplay(entry.quantity)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-rose-700">
                      {entry.type === "DN"
                        ? formatQuantityDisplay(entry.quantity)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatQuantityDisplay(entry.runningQty)}
                    </td>
                  </tr>
                  <tr className="border-b bg-muted/10">
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2 pl-12 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-background px-2 py-1">
                          Flow:{" "}
                          <span className="font-medium">
                            {entry.type === "GRN" ? "Stock In" : "Stock Out"}
                          </span>
                        </span>
                        <span className="rounded-md bg-background px-2 py-1">
                          Line Qty:{" "}
                          <span className="font-medium">
                            {formatQuantityDisplay(entry.quantity)}
                          </span>
                        </span>
                        <span className="rounded-md bg-background px-2 py-1">
                          Line Bags:{" "}
                          <span className="font-medium">
                            {formatQuantityDisplay(entry.bags)}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2" />
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
