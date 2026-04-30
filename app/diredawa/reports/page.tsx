"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/authProvider";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ReportEntity =
  | "sales"
  | "purchases"
  | "grn"
  | "dn"
  | "shippingInvoices"
  | "receivedPayments"
  | "vendorPayments"
  | "expensePayments";

type Granularity = "daily" | "monthly" | "yearly";
type Metric = "amount" | "quantity" | "count";

type RowRecord = {
  date: string;
  reference?: string;
  item?: string;
  shipper?: string;
  buyer?: string;
  supplier?: string;
  customer?: string;
  status?: string;
  measurementType?: string;
  paymentTerms?: string;
  modeOfTransport?: string;
  freight?: string;
  shipmentType?: string;
  amount?: number;
  quantity?: number;
};

type ViewMode =
  | "total"
  | "item"
  | "shipper"
  | "buyer"
  | "supplier"
  | "customer"
  | "status"
  | "reference"
  | "measurementType"
  | "paymentTerms"
  | "modeOfTransport"
  | "freight"
  | "shipmentType";

type EntityConfig = {
  label: string;
  endpoint: string;
  transform: (raw: unknown) => RowRecord[];
};

const ENTITY_CONFIG: Record<ReportEntity, EntityConfig> = {
  sales: {
    label: "Sales Orders",
    endpoint: "/api/orders",
    transform: (raw) => {
      const orders = normalizeList(raw);
      const rows: RowRecord[] = [];
      for (const order of orders) {
        const items = Array.isArray(order.items) ? order.items : [];
        for (const item of items) {
          rows.push({
            date: safeDate(order.order_date),
            reference: safeText(order.order_number),
            item: safeText(item.item_name),
            shipper: safeText(order.shipper),
            buyer: safeText(order.buyer),
            measurementType: safeText(order.measurement_type),
            paymentTerms: safeText(order.payment_terms),
            modeOfTransport: safeText(order.mode_of_transport),
            freight: safeText(order.freight),
            shipmentType: safeText(order.shipment_type),
            amount: toNumber(item.total_price),
            quantity: toNumber(item.quantity),
          });
        }
      }
      return rows;
    },
  },
  purchases: {
    label: "Purchases",
    endpoint: "/api/purchases",
    transform: (raw) => {
      const purchases = normalizeList(raw);
      const rows: RowRecord[] = [];
      for (const purchase of purchases) {
        const items = Array.isArray(purchase.items) ? purchase.items : [];
        for (const item of items) {
          rows.push({
            date: safeDate(purchase.order_date),
            reference: safeText(purchase.purchase_number),
            item: safeText(item.item_name),
            shipper: safeText(purchase.shipper),
            buyer: safeText(purchase.buyer),
            supplier: safeText(purchase.buyer),
            customer: safeText(purchase.buyer),
            status: safeText(purchase.status),
            measurementType: safeText(purchase.measurement_type),
            paymentTerms: safeText(
              purchase.payment_type || purchase.payment_terms,
            ),
            modeOfTransport: safeText(purchase.mode_of_transport),
            freight: safeText(purchase.freight),
            shipmentType: safeText(purchase.shipment_type),
            amount: toNumber(item.total_price),
            quantity: toNumber(item.quantity),
          });
        }
      }
      return rows;
    },
  },
  grn: {
    label: "Inventory - GRN",
    endpoint: "/api/inventory/grn",
    transform: (raw) => {
      const grns = normalizeList(raw);
      const rows: RowRecord[] = [];
      for (const grn of grns) {
        const items = Array.isArray(grn.items) ? grn.items : [];
        for (const item of items) {
          rows.push({
            date:
              safeDate(grn.date || grn.created_at || grn.updated_at) ||
              new Date().toISOString(),
            reference: String(grn.grn_no ?? ""),
            item: safeText(item.item_name),
            supplier: safeText(grn.supplier_name),
            measurementType: safeText(item.unit_measurement),
            amount: toNumber(item.quantity),
            quantity: toNumber(item.quantity),
          });
        }
      }
      return rows;
    },
  },
  dn: {
    label: "Inventory - DN",
    endpoint: "/api/inventory/dn",
    transform: (raw) => {
      const dns = normalizeList(raw);
      const rows: RowRecord[] = [];
      for (const dn of dns) {
        const items = Array.isArray(dn.items) ? dn.items : [];
        for (const item of items) {
          rows.push({
            date:
              safeDate(dn.date || dn.created_at || dn.updated_at) ||
              new Date().toISOString(),
            reference: safeText(dn.dn_no),
            item: safeText(item.item_name),
            customer: safeText(dn.customer_name),
            measurementType: safeText(item.unit_measurement),
            amount: toNumber(item.quantity),
            quantity: toNumber(item.quantity),
          });
        }
      }
      return rows;
    },
  },
  shippingInvoices: {
    label: "Shipping Invoices",
    endpoint: "/api/inventory/shipping-invoices",
    transform: (raw) => {
      const invoices = normalizeList(raw);
      return invoices.map((inv) => ({
        date: safeDate(inv.invoice_date || inv.created_at || inv.updated_at),
        reference: safeText(inv.invoice_number),
        customer: safeText(inv.order_number),
        status: inv.authorized_by ? "authorized" : "pending",
        amount: toNumber(inv.final_price),
        quantity: 1,
      }));
    },
  },
  receivedPayments: {
    label: "Received Payments",
    endpoint: "/api/accounting/received-payments",
    transform: (raw) => {
      const payments = normalizeList(raw);
      return payments.map((p) => ({
        date: safeDate(p.date || p.payment_date || p.created_at),
        reference: safeText(p.payment_number || p.received_payment_no || p.id),
        customer: safeText(p.customer_name || p.customer),
        status: safeText(p.status),
        amount: toNumber(p.amount || p.total_amount || p.paid_amount),
        quantity: 1,
      }));
    },
  },
  vendorPayments: {
    label: "Vendor Payments",
    endpoint: "/api/accounting/vendor-payments",
    transform: (raw) => {
      const payments = normalizeList(raw);
      return payments.map((p) => ({
        date: safeDate(p.date || p.payment_date || p.created_at),
        reference: safeText(p.payment_number || p.vendor_payment_no || p.id),
        supplier: safeText(p.vendor_name || p.supplier_name || p.vendor),
        status: safeText(p.status),
        amount: toNumber(p.amount || p.total_amount || p.paid_amount),
        quantity: 1,
      }));
    },
  },
  expensePayments: {
    label: "Expense Payments",
    endpoint: "/api/accounting/expense-payments",
    transform: (raw) => {
      const payments = normalizeList(raw);
      return payments.map((p) => ({
        date: safeDate(p.date || p.payment_date || p.created_at),
        reference: safeText(p.payment_number || p.expense_payment_no || p.id),
        customer: safeText(p.expense_type || p.party || p.description),
        status: safeText(p.status),
        amount: toNumber(p.amount || p.total_amount || p.paid_amount),
        quantity: 1,
      }));
    },
  },
};

export default function ReportsPage() {
  const auth = useAuth();
  const [entity, setEntity] = useState<ReportEntity>("sales");
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [metric, setMetric] = useState<Metric>("amount");
  const [viewMode, setViewMode] = useState<ViewMode>("total");
  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateFilterAppliedAt, setDateFilterAppliedAt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<RowRecord[]>([]);
  const [hiddenSeriesKeys, setHiddenSeriesKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setViewMode("total");
  }, [entity]);

  const viewOptions = useMemo(() => getViewOptions(entity), [entity]);

  useEffect(() => {
    setHiddenSeriesKeys(new Set());
  }, [
    entity,
    viewMode,
    granularity,
    metric,
    dateFrom,
    dateTo,
    dateFilterAppliedAt,
  ]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(ENTITY_CONFIG[entity].endpoint, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            data?.detail || data?.message || "Failed to fetch report data",
          );
        const parsed = ENTITY_CONFIG[entity]
          .transform(data)
          .filter((r) => !!r.date);
        if (active) setRows(parsed);
      } catch (err) {
        if (!active) return;
        setRows([]);
        setError(
          err instanceof Error ? err.message : "Failed to load report data",
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [entity]);

  const dateFilteredRows = useMemo(() => {
    return rows.filter((row) => {
      const rowDate = toDateOnly(row.date);
      if (!rowDate) return false;
      if (dateFrom && rowDate < dateFrom) return false;
      if (dateTo && rowDate > dateTo) return false;
      return true;
    });
  }, [rows, dateFrom, dateTo]);

  const chartModel = useMemo(() => {
    if (viewMode !== "total") {
      const groupTotals = new Map<string, number>();
      for (const row of dateFilteredRows) {
        const groupValue = getGroupValue(row, viewMode);
        const base =
          metric === "count"
            ? 1
            : metric === "quantity"
            ? row.quantity ?? 0
            : row.amount ?? 0;
        groupTotals.set(groupValue, (groupTotals.get(groupValue) ?? 0) + base);
      }
      const topGroups = Array.from(groupTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const byPeriod = new Map<
        string,
        { refs: Set<string>; values: Record<string, number> }
      >();
      for (const row of dateFilteredRows) {
        const period = toPeriodKey(row.date, granularity);
        if (!period) continue;
        const groupValue = getGroupValue(row, viewMode);
        if (!topGroups.includes(groupValue)) continue;
        const base =
          metric === "count"
            ? 1
            : metric === "quantity"
            ? row.quantity ?? 0
            : row.amount ?? 0;
        const current = byPeriod.get(period) ?? {
          refs: new Set<string>(),
          values: {},
        };
        current.values[groupValue] = (current.values[groupValue] ?? 0) + base;
        if (row.reference) current.refs.add(row.reference);
        byPeriod.set(period, current);
      }

      const data = Array.from(byPeriod.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([period, info]) => {
          const row: Record<string, unknown> = {
            period,
            refs: Array.from(info.refs).slice(0, 3),
          };
          for (const groupValue of topGroups) {
            row[groupValue] = round2(info.values[groupValue] ?? 0);
          }
          return row;
        });

      return { data, lineKeys: topGroups };
    }

    const byPeriod = new Map<string, { value: number; refs: Set<string> }>();
    for (const row of dateFilteredRows) {
      const period = toPeriodKey(row.date, granularity);
      if (!period) continue;
      const base =
        metric === "count"
          ? 1
          : metric === "quantity"
          ? row.quantity ?? 0
          : row.amount ?? 0;
      const current = byPeriod.get(period) ?? {
        value: 0,
        refs: new Set<string>(),
      };
      current.value += base;
      if (row.reference) current.refs.add(row.reference);
      byPeriod.set(period, current);
    }
    const data = Array.from(byPeriod.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, info]) => ({
        period,
        actual: round2(info.value),
        refs: Array.from(info.refs).slice(0, 3),
      }));
    return { data, lineKeys: ["actual"] };
  }, [dateFilteredRows, granularity, metric, viewMode]);

  const pieData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const row of chartModel.data) {
      for (const key of chartModel.lineKeys) {
        const value = Number((row as Record<string, unknown>)[key] ?? 0);
        totals.set(key, (totals.get(key) ?? 0) + value);
      }
    }
    return chartModel.lineKeys
      .map((key, index) => ({
        name: key === "actual" ? "Actual" : key,
        key,
        value: round2(totals.get(key) ?? 0),
        color: LINE_COLORS[index % LINE_COLORS.length],
      }))
      .filter((entry) => entry.value > 0);
  }, [chartModel.data, chartModel.lineKeys]);

  if (!auth?.isAdmin) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Only admin can access reports.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Interactive analytics across sales, purchase, inventory, and payment
          entities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 rounded-md border bg-white p-4">
        <LabeledSelect
          label="Entity"
          value={entity}
          onChange={(v) => setEntity(v as ReportEntity)}
          options={Object.entries(ENTITY_CONFIG).map(([value, cfg]) => ({
            value,
            label: cfg.label,
          }))}
        />
        <LabeledSelect
          label="Period"
          value={granularity}
          onChange={(v) => setGranularity(v as Granularity)}
          options={[
            { value: "daily", label: "Daily" },
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
        />
        <LabeledSelect
          label="Metric"
          value={metric}
          onChange={(v) => setMetric(v as Metric)}
          options={[
            { value: "amount", label: "Amount" },
            { value: "quantity", label: "Quantity" },
            { value: "count", label: "Count" },
          ]}
        />
        {viewOptions.length > 1 && (
          <LabeledSelect
            label="View"
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
            options={viewOptions}
          />
        )}
        <div className="space-y-1">
          <label className="text-xs font-medium">From Date</label>
          <input
            type="date"
            value={pendingDateFrom}
            onChange={(e) => setPendingDateFrom(e.target.value)}
            className="h-9 w-full rounded-md border px-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">To Date</label>
          <input
            type="date"
            value={pendingDateTo}
            onChange={(e) => setPendingDateTo(e.target.value)}
            className="h-9 w-full rounded-md border px-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Date Action</label>
          <Button
            type="button"
            className="h-9 w-full"
            onClick={() => {
              setDateFrom(pendingDateFrom);
              setDateTo(pendingDateTo);
              setDateFilterAppliedAt(Date.now());
            }}
          >
            Apply
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Applied range: {dateFrom || "Any"} to {dateTo || "Any"}
      </div>

      <div className="rounded-md border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">
            Trend ({ENTITY_CONFIG[entity].label}) - {granularity}
          </div>
        </div>
        {loading ? (
          <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
            Loading report data...
          </div>
        ) : error ? (
          <div className="h-[420px] flex items-center justify-center text-sm text-red-600">
            {error}
          </div>
        ) : chartModel.data.length === 0 ? (
          <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
            No data found for this selection.
          </div>
        ) : (
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartModel.data}
                margin={{ left: 10, right: 20, top: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip content={<ReportTooltip />} />
                <Legend
                  onClick={(e) => {
                    const key = String(
                      (e as { dataKey?: string }).dataKey ?? "",
                    );
                    if (!key) return;
                    setHiddenSeriesKeys((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    });
                  }}
                />
                {chartModel.lineKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    name={key === "actual" ? "Actual" : key}
                    hide={hiddenSeriesKeys.has(key)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md border bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">
              Bar Trend ({ENTITY_CONFIG[entity].label}) - {granularity}
            </div>
          </div>
          {loading ? (
            <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
              Loading report data...
            </div>
          ) : error ? (
            <div className="h-[420px] flex items-center justify-center text-sm text-red-600">
              {error}
            </div>
          ) : chartModel.data.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
              No data found for this selection.
            </div>
          ) : (
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartModel.data}
                  margin={{ left: 10, right: 20, top: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip content={<ReportTooltip />} />
                  <Legend
                    onClick={(e) => {
                      const key = String(
                        (e as { dataKey?: string }).dataKey ?? "",
                      );
                      if (!key) return;
                      setHiddenSeriesKeys((prev) => {
                        const next = new Set(prev);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      });
                    }}
                  />
                  {chartModel.lineKeys.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={LINE_COLORS[index % LINE_COLORS.length]}
                      name={key === "actual" ? "Actual" : key}
                      hide={hiddenSeriesKeys.has(key)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-md border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">
              Pie Distribution ({ENTITY_CONFIG[entity].label})
            </div>
          </div>
          {loading ? (
            <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
              Loading report data...
            </div>
          ) : error ? (
            <div className="h-[420px] flex items-center justify-center text-sm text-red-600">
              {error}
            </div>
          ) : pieData.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
              No data found for this selection.
            </div>
          ) : (
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ReportTooltip />} />
                  <Legend
                    onClick={(e) => {
                      const key = String(
                        (e as { dataKey?: string }).dataKey ?? "",
                      );
                      if (!key) return;
                      setHiddenSeriesKeys((prev) => {
                        const next = new Set(prev);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      });
                    }}
                  />
                  <Pie
                    data={pieData.filter((entry) => !hiddenSeriesKeys.has(entry.key))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={140}
                  >
                    {pieData
                      .filter((entry) => !hiddenSeriesKeys.has(entry.key))
                      .map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    payload?: { refs?: string[] };
  }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as { refs?: string[] } | undefined;
  return (
    <div className="rounded-md border bg-white p-2 text-xs shadow">
      <div className="font-semibold">{label}</div>
      {payload.map((entry) => (
        <div key={String(entry.dataKey)}>
          {entry.name}: {Number(entry.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 20 })}
        </div>
      ))}
      {!!point?.refs?.length && <div>Order No: {point.refs.join(", ")}</div>}
    </div>
  );
}

const LINE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#7c3aed",
  "#db2777",
  "#0891b2",
];

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border bg-white px-2 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function normalizeList(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>;
  if (raw && typeof raw === "object") {
    const maybe = raw as { results?: unknown };
    if (Array.isArray(maybe.results))
      return maybe.results as Array<Record<string, unknown>>;
  }
  return [];
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function toDateOnly(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function getGroupValue(row: RowRecord, mode: Exclude<ViewMode, "total">) {
  const valueMap = {
    reference: row.reference,
    item: row.item,
    shipper: row.shipper,
    buyer: row.buyer,
    supplier: row.supplier,
    customer: row.customer,
    status: row.status,
    measurementType: row.measurementType,
    paymentTerms: row.paymentTerms,
    modeOfTransport: row.modeOfTransport,
    freight: row.freight,
    shipmentType: row.shipmentType,
  } as const;
  return valueMap[mode] || "Unknown";
}

function getViewOptions(
  entity: ReportEntity,
): Array<{ value: ViewMode; label: string }> {
  if (entity === "sales" || entity === "purchases") {
    return [
      { value: "total", label: "Total" },
      { value: "item", label: "Per Item" },
      { value: "shipper", label: "Per Shipper" },
      { value: "buyer", label: "Per Buyer" },
      { value: "measurementType", label: "Per Measurement Type" },
      { value: "paymentTerms", label: "Per Payment Terms" },
      { value: "modeOfTransport", label: "Per Mode of Transport" },
      { value: "freight", label: "Per Freight" },
      { value: "shipmentType", label: "Per Shipment Type" },
    ];
  }
  if (entity === "grn") {
    return [
      { value: "total", label: "Total" },
      { value: "item", label: "Per Item" },
      { value: "supplier", label: "Per Supplier" },
      { value: "measurementType", label: "Per Measurement Type" },
    ];
  }
  if (entity === "dn") {
    return [
      { value: "total", label: "Total" },
      { value: "item", label: "Per Item" },
      { value: "customer", label: "Per Customer" },
      { value: "measurementType", label: "Per Measurement Type" },
    ];
  }
  if (entity === "shippingInvoices") {
    return [
      { value: "total", label: "Total" },
      { value: "reference", label: "Per Invoice Number" },
      { value: "customer", label: "Per Order Number" },
      { value: "status", label: "Per Authorization Status" },
    ];
  }
  if (entity === "receivedPayments") {
    return [
      { value: "total", label: "Total" },
      { value: "reference", label: "Per Payment Number" },
      { value: "customer", label: "Per Customer" },
      { value: "status", label: "Per Status" },
    ];
  }
  if (entity === "vendorPayments") {
    return [
      { value: "total", label: "Total" },
      { value: "reference", label: "Per Payment Number" },
      { value: "supplier", label: "Per Vendor/Supplier" },
      { value: "status", label: "Per Status" },
    ];
  }
  return [
    { value: "total", label: "Total" },
    { value: "reference", label: "Per Payment Number" },
    { value: "customer", label: "Per Expense Type/Party" },
    { value: "status", label: "Per Status" },
  ];
}

function toPeriodKey(isoDate: string, granularity: Granularity): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  if (granularity === "yearly") return `${y}`;
  if (granularity === "monthly") return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

function round2(value: number) {
  return value;
}
