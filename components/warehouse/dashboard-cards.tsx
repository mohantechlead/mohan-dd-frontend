"use client";

import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { money, WAREHOUSE_DASHBOARD_URL, type WarehouseDashboard } from "@/lib/warehouse";

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

export function WarehouseDashboardCards() {
  const { data, isLoading } = useSWR<WarehouseDashboard>(
    WAREHOUSE_DASHBOARD_URL,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total WSNs" value={data.total_wsns} />
      <StatCard label="Active" value={data.active_wsns} color="text-green-600" />
      <StatCard label="Expired" value={data.expired_wsns} color="text-red-600" />
      <StatCard label="Released" value={data.released_wsns} color="text-blue-600" />
      <StatCard label="Storage Value" value={`${money(data.total_storage_value)} ETB`} />
      <StatCard label="Total Paid" value={`${money(data.total_paid)} ETB`} color="text-green-600" />
      <StatCard label="Payment Remaining" value={`${money(data.payment_remaining)} ETB`} color="text-amber-600" />
      <StatCard
        label="Expiring Soon"
        value={data.expiring_soon_count}
        color={data.expiring_soon_count > 0 ? "text-orange-600" : "text-green-600"}
      />
    </div>
  );
}

export function WarehouseItemSummaryCards() {
  const { data, isLoading } = useSWR<WarehouseDashboard>(
    WAREHOUSE_DASHBOARD_URL,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard label="Total Stored" value={`${Number(data.total_items_stored).toLocaleString()} kg`} />
      <StatCard label="Total Released" value={`${Number(data.total_items_released).toLocaleString()} kg`} color="text-blue-600" />
      <StatCard label="Remaining in Storage" value={`${Number(data.total_items_remaining).toLocaleString()} kg`} color="text-green-600" />
    </div>
  );
}
