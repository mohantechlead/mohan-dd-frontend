"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TableSearch } from "@/components/table-search";
import { Button } from "@/components/ui/button";

type PaymentStatus = "pending" | "approved" | "completed" | "cancelled" | string;
type SourceType = "received" | "vendor" | "expense";

type ReceivedPayment = {
  payment_number: string;
  payment_date: string;
  customer_name: string;
  order_number: string;
  amount: number;
  status: PaymentStatus;
};

type VendorPayment = {
  payment_number: string;
  payment_date: string;
  supplier_name: string;
  purchase_number: string;
  amount: number;
  status: PaymentStatus;
};

type ExpensePayment = {
  expense_number: string;
  expense_date: string;
  payee: string;
  category: string;
  amount: number;
  status: PaymentStatus;
};

type LedgerRow = {
  key: string;
  source: SourceType;
  reference: string;
  date: string;
  party: string;
  context: string;
  status: PaymentStatus;
  credit: number;
  debit: number;
  net: number;
  detailsUrl: string;
};

export default function AccountingLedgerPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [rRes, vRes, eRes] = await Promise.all([
          fetch("/api/accounting/received-payments", { credentials: "include" }),
          fetch("/api/accounting/vendor-payments", { credentials: "include" }),
          fetch("/api/accounting/expense-payments", { credentials: "include" }),
        ]);
        const [rData, vData, eData] = await Promise.all([
          rRes.json(),
          vRes.json(),
          eRes.json(),
        ]);

        const received: LedgerRow[] = (Array.isArray(rData) ? rData : []).map(
          (x: ReceivedPayment) => ({
            key: `received-${x.payment_number}`,
            source: "received",
            reference: x.payment_number,
            date: x.payment_date,
            party: x.customer_name,
            context: `Order ${x.order_number}`,
            status: x.status,
            credit: Number(x.amount || 0),
            debit: 0,
            net: Number(x.amount || 0),
            detailsUrl: `/diredawa/accounting/received-payments/${encodeURIComponent(
              x.payment_number
            )}`,
          })
        );

        const vendor: LedgerRow[] = (Array.isArray(vData) ? vData : []).map(
          (x: VendorPayment) => ({
            key: `vendor-${x.payment_number}`,
            source: "vendor",
            reference: x.payment_number,
            date: x.payment_date,
            party: x.supplier_name,
            context: `Purchase ${x.purchase_number}`,
            status: x.status,
            credit: 0,
            debit: Number(x.amount || 0),
            net: -Number(x.amount || 0),
            detailsUrl: `/diredawa/accounting/vendor-payments/${encodeURIComponent(
              x.payment_number
            )}`,
          })
        );

        const expense: LedgerRow[] = (Array.isArray(eData) ? eData : []).map(
          (x: ExpensePayment) => ({
            key: `expense-${x.expense_number}`,
            source: "expense",
            reference: x.expense_number,
            date: x.expense_date,
            party: x.payee,
            context: x.category,
            status: x.status,
            credit: 0,
            debit: Number(x.amount || 0),
            net: -Number(x.amount || 0),
            detailsUrl: `/diredawa/accounting/expense-payments/${encodeURIComponent(
              x.expense_number
            )}`,
          })
        );

        const merged = [...received, ...vendor, ...expense].sort((a, b) => {
          if (a.date === b.date) return a.reference.localeCompare(b.reference);
          return a.date.localeCompare(b.date);
        });
        if (mounted) setRows(merged);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      if (!q) return true;
      return [r.reference, r.party, r.context, r.source, r.status]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, statusFilter, sourceFilter, fromDate, toDate]);

  const withRunning = useMemo(() => {
    let running = 0;
    return filtered.map((r) => {
      running += r.net;
      return { ...r, runningBalance: running };
    });
  }, [filtered]);

  const totals = useMemo(() => {
    const credit = filtered.reduce((s, r) => s + r.credit, 0);
    const debit = filtered.reduce((s, r) => s + r.debit, 0);
    return { credit, debit, net: credit - debit };
  }, [filtered]);

  return (
    <div className="max-w-7xl mx-auto mt-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounting Ledger</h1>
        <Button
          variant="outline"
          onClick={() => {
            setSearch("");
            setStatusFilter("all");
            setSourceFilter("all");
            setFromDate("");
            setToDate("");
          }}
        >
          Reset Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Total Inflow</p>
          <p className="text-xl font-semibold text-emerald-700">
            {totals.credit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Total Outflow</p>
          <p className="text-xl font-semibold text-rose-700">
            {totals.debit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Net Movement</p>
          <p
            className={`text-xl font-semibold ${
              totals.net >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {totals.net.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search reference, party, context..."
          />
        </div>
        <select
          className="h-9 rounded-md border bg-white px-3 text-sm"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="all">All Sources</option>
          <option value="received">Received</option>
          <option value="vendor">Vendor</option>
          <option value="expense">Expense</option>
        </select>
        <select
          className="h-9 rounded-md border bg-white px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 rounded-md border bg-white px-2 text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 rounded-md border bg-white px-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading ledger...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Source</th>
                <th className="px-3 py-2 text-left">Reference</th>
                <th className="px-3 py-2 text-left">Party</th>
                <th className="px-3 py-2 text-left">Context</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Credit</th>
                <th className="px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {withRunning.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                    No ledger entries for selected filters.
                  </td>
                </tr>
              ) : (
                withRunning.map((r) => (
                  <tr key={r.key} className="border-t">
                    <td className="px-3 py-2">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 capitalize">{r.source}</td>
                    <td className="px-3 py-2">
                      <Link className="text-blue-600 hover:underline" href={r.detailsUrl}>
                        {r.reference}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.party}</td>
                    <td className="px-3 py-2">{r.context}</td>
                    <td className="px-3 py-2 capitalize">{r.status}</td>
                    <td className="px-3 py-2 text-right text-emerald-700">
                      {r.credit
                        ? r.credit.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-right text-rose-700">
                      {r.debit
                        ? r.debit.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : "-"}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${
                        r.runningBalance >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {r.runningBalance.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

