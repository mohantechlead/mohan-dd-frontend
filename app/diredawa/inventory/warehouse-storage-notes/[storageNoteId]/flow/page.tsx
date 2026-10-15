"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import {
  WSN_FLOW_URL,
  money,
  formatDate,
  type WarehouseItemFlow,
} from "@/lib/warehouse";

function StatusBadge({ status }: { status: string }) {
  const s = String(status ?? "").toLowerCase();
  const cls =
    s === "completed"
      ? "bg-green-100 text-green-800"
      : s === "approved"
        ? "bg-blue-100 text-blue-800"
        : s === "cancelled"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}
    >
      {s}
    </span>
  );
}

export default function WarehouseItemFlowPage() {
  const params = useParams<{ storageNoteId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const noteId = params.storageNoteId;

  const [flow, setFlow] = useState<WarehouseItemFlow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!noteId) return;
      try {
        const res = await fetch(`${WSN_FLOW_URL(noteId)}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          showToast({
            title: "Failed to load Item Flow",
            description: formatApiErrorMessage(data),
            variant: "error",
          });
          return;
        }
        setFlow(data as WarehouseItemFlow);
      } catch {
        showToast({
          title: "Failed to load Item Flow",
          description: "Something went wrong.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!flow)
    return <div className="p-10 text-center">Flow data not found.</div>;

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/diredawa/inventory/warehouse-storage-notes/${noteId}`)
          }
        >
          Back to Storage Note
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">Item Flow</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {flow.wsn_no} — {flow.customer_name}
          </p>
        </div>
        <div className="w-[150px]" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="border rounded-md p-4 bg-white">
          <div className="text-xs text-muted-foreground">Total Agreed</div>
          <div className="text-lg font-semibold">{flow.total_agreed_quantity}</div>
        </div>
        <div className="border rounded-md p-4 bg-white">
          <div className="text-xs text-muted-foreground">Total Entered</div>
          <div className="text-lg font-semibold text-blue-600">{flow.total_entry_quantity}</div>
        </div>
        <div className="border rounded-md p-4 bg-white">
          <div className="text-xs text-muted-foreground">Total Released</div>
          <div className="text-lg font-semibold text-orange-600">{flow.total_released_quantity}</div>
        </div>
        <div className="border rounded-md p-4 bg-white">
          <div className="text-xs text-muted-foreground">Remaining</div>
          <div className="text-lg font-semibold text-green-600">{flow.remaining_quantity}</div>
        </div>
        <div className="border rounded-md p-4 bg-white">
          <div className="text-xs text-muted-foreground">Storage Price</div>
          <div className="text-lg font-semibold">{money(flow.storage_price)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Paid: {money(flow.total_paid)} | Remaining: {money(flow.payment_remaining)}
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
          Delivery Entries ({flow.entries.length})
        </h2>
        {flow.entries.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No entries recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Bags</th>
              </tr>
            </thead>
            <tbody>
              {flow.entries.map((entry, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="px-4 py-2">{formatDate(entry.entry_date)}</td>
                  <td className="px-4 py-2">{entry.item_name}</td>
                  <td className="px-4 py-2">{entry.code || "—"}</td>
                  <td className="px-4 py-2 text-right">{entry.quantity}</td>
                  <td className="px-4 py-2 text-right">{entry.bags ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Releases */}
      <div className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
          Releases ({flow.releases.length})
        </h2>
        {flow.releases.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No releases recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2 text-left">WRN No</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Bags</th>
              </tr>
            </thead>
            <tbody>
              {flow.releases.map((release, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{release.wrn_no}</td>
                  <td className="px-4 py-2">{formatDate(release.release_date)}</td>
                  <td className="px-4 py-2">{release.item_name}</td>
                  <td className="px-4 py-2">{release.code || "—"}</td>
                  <td className="px-4 py-2 text-right">{release.quantity}</td>
                  <td className="px-4 py-2 text-right">{release.bags ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payments */}
      <div className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
          Payments ({flow.payments.length})
        </h2>
        {flow.payments.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No payments recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2 text-left">Payment No</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {flow.payments.map((payment, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{payment.payment_number}</td>
                  <td className="px-4 py-2">{formatDate(payment.payment_date)}</td>
                  <td className="px-4 py-2 text-right">{money(payment.amount)}</td>
                  <td className="px-4 py-2 capitalize">{payment.payment_type}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={payment.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
