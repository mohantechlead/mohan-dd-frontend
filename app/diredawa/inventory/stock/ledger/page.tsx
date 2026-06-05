"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/authProvider";
import { Button } from "@/components/ui/button";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";
import * as XLSX from "xlsx";

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

/** Normalize API / display dates to YYYY-MM-DD for range comparisons. */
const entryDay = (entryDate: string | null): string | null => {
  if (!entryDate?.trim()) return null;
  const raw = entryDate.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const matchesDateRange = (
  entry: StockLedgerEntry,
  from: string,
  to: string,
): boolean => {
  const day = entryDay(entry.entryDate);
  if (from && (!day || day < from)) return false;
  if (to && (!day || day > to)) return false;
  return true;
};

const computeOpeningBalance = (
  allEntries: StockLedgerEntry[],
  from: string,
): number => {
  if (!from) return 0;
  return allEntries.reduce((sum, entry) => {
    const day = entryDay(entry.entryDate);
    if (day && day < from) return sum + entry.raw;
    return sum;
  }, 0);
};

const sortEntriesChronologically = (list: StockLedgerEntry[]) =>
  [...list].sort((a, b) => {
    const ad = entryDay(a.entryDate) ?? "";
    const bd = entryDay(b.entryDate) ?? "";
    if (ad !== bd) return ad.localeCompare(bd);
    return `${a.type}-${a.documentNo}`.localeCompare(`${b.type}-${b.documentNo}`);
  });

/** Filtered rows, running balance column, and summary cards for a date range. */
function computeLedgerView(
  allEntries: StockLedgerEntry[],
  from: string,
  to: string,
) {
  const hasDateFilter = Boolean(from || to);
  const filteredEntries = sortEntriesChronologically(
    allEntries.filter((entry) => matchesDateRange(entry, from, to)),
  );

  const totalIn = filteredEntries
    .filter((entry) => entry.type === "GRN")
    .reduce((sum, entry) => sum + entry.quantity, 0);
  const totalOut = filteredEntries
    .filter((entry) => entry.type === "DN")
    .reduce((sum, entry) => sum + entry.quantity, 0);

  const openingBalance = computeOpeningBalance(allEntries, from);
  let runningQty = openingBalance;
  const entriesWithRunning = filteredEntries.map((entry) => {
    runningQty += entry.raw;
    return { ...entry, runningQty };
  });

  const periodNet = totalIn - totalOut;
  const closingBalance =
    entriesWithRunning.length > 0
      ? entriesWithRunning[entriesWithRunning.length - 1].runningQty
      : openingBalance;

  // Summary card: net movement in range when filtered; full stock when not.
  const summaryBalance = hasDateFilter ? periodNet : closingBalance;

  return {
    filteredEntries,
    entriesWithRunning,
    stats: {
      totalIn,
      totalOut,
      periodNet,
      openingBalance,
      closingBalance,
      summaryBalance,
    },
  };
}

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
  const urlDateFrom = (searchParams.get("date_from") ?? "").trim();
  const urlDateTo = (
    searchParams.get("date_to") ??
    searchParams.get("as_of_date") ??
    ""
  ).trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockItem, setStockItem] = useState<StockItem | null>(null);
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [dateFrom, setDateFrom] = useState(urlDateFrom);
  const [dateTo, setDateTo] = useState(urlDateTo);
  const [appliedDateFrom, setAppliedDateFrom] = useState(urlDateFrom);
  const [appliedDateTo, setAppliedDateTo] = useState(urlDateTo);
  const [dateFilterError, setDateFilterError] = useState<string | null>(null);

  useEffect(() => {
    if (!urlDateFrom && !urlDateTo) return;
    setDateFrom(urlDateFrom);
    setDateTo(urlDateTo);
    setAppliedDateFrom(urlDateFrom);
    setAppliedDateTo(urlDateTo);
  }, [urlDateFrom, urlDateTo]);

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

        const merged: StockLedgerEntry[] = sortEntriesChronologically(
          [...grnEntries, ...dnEntries].filter((entry) => entry !== null),
        );

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

  const hasDateFilter = Boolean(appliedDateFrom || appliedDateTo);

  const { entriesWithRunning, stats } = useMemo(
    () => computeLedgerView(entries, appliedDateFrom, appliedDateTo),
    [entries, appliedDateFrom, appliedDateTo],
  );

  const applyDateFilters = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDateFilterError("From date cannot be after to date.");
      return;
    }
    setDateFilterError(null);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  const resetDateFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setDateFilterError(null);
  };

  const exportToExcel = () => {
    if (!entriesWithRunning.length || !stockItem) return;

    const rows = entriesWithRunning.map((entry) => ({
      "Entry Date": entry.entryDate
        ? new Date(entry.entryDate).toLocaleDateString()
        : "",
      Type: entry.type,
      "Reference No": entry.documentNo,
      Flow: entry.type === "GRN" ? "Stock In" : "Stock Out",
      "In Qty": entry.type === "GRN" ? entry.quantity : 0,
      "Out Qty": entry.type === "DN" ? entry.quantity : 0,
      "Line Bags": entry.bags,
      "Running Balance Qty": entry.runningQty,
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Stock Ledger");

    const safeItemName = stockItem.item_name
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_");
    const safeCode = (stockItem.code ?? "NA").replace(/[\\/:*?"<>|]/g, "_");
    const fileName = `stock_ledger_${safeItemName}_${safeCode}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium">Date filters</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              From date
            </label>
            <input
              type="date"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              To date
            </label>
            <input
              type="date"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button type="button" onClick={applyDateFilters}>
              Apply Filters
            </Button>
            <Button type="button" variant="outline" onClick={resetDateFilters}>
              Reset
            </Button>
          </div>
        </div>
        {dateFilterError && (
          <p className="mt-2 text-sm text-red-600">{dateFilterError}</p>
        )}
        {hasDateFilter && !dateFilterError && (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing entries
            {appliedDateFrom ? ` from ${appliedDateFrom}` : ""}
            {appliedDateTo ? ` to ${appliedDateTo}` : ""}. Total In, Total Out,
            and Balance are calculated for this range only (Balance = In − Out).
            {stats.closingBalance !== stats.periodNet && (
              <>
                {" "}
                Stock at end of range:{" "}
                {formatQuantityDisplay(stats.closingBalance)}.
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:flex-1">
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              {hasDateFilter ? "Total In (filtered)" : "Total In"}
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">
              {formatQuantityDisplay(stats.totalIn)}
            </p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              {hasDateFilter ? "Total Out (filtered)" : "Total Out"}
            </p>
            <p className="mt-1 text-lg font-semibold text-rose-700">
              {formatQuantityDisplay(stats.totalOut)}
            </p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              {hasDateFilter ? "Balance (filtered)" : "Current Balance"}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatQuantityDisplay(stats.summaryBalance)}
            </p>
            {hasDateFilter && stats.closingBalance !== stats.periodNet && (
              <p className="mt-1 text-xs text-muted-foreground">
                Stock at end: {formatQuantityDisplay(stats.closingBalance)}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="default"
            className="shadow-sm"
            onClick={exportToExcel}
            disabled={loading || !!error || entriesWithRunning.length === 0}
          >
            Export Excel
          </Button>
          <Button asChild variant="outline" className="shadow-sm">
            <Link href="/diredawa/inventory/stock">Back to Stock</Link>
          </Button>
        </div>
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
        ) : entries.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No DN/GRN transactions found for this stock item.
            </p>
          </div>
        ) : entriesWithRunning.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No transactions in the selected date range.
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
