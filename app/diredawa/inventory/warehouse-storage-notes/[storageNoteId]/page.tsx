"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import {
  WSN_API_URL,
  PERIOD_UNITS,
  periodLabel,
  money,
  formatDate,
  type WarehouseStorageNote,
} from "@/lib/warehouse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PERIOD_UNIT_LABEL = (u: string) =>
  u.charAt(0).toUpperCase() + u.slice(1);

function StatusBadge({ status }: { status: string }) {
  const s = String(status ?? "").toLowerCase();
  const cls =
    s === "expired"
      ? "bg-red-100 text-red-800"
      : s === "released"
        ? "bg-muted text-muted-foreground"
        : "bg-green-100 text-green-800";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}
    >
      {s}
    </span>
  );
}

export default function WarehouseStorageNoteDetailPage() {
  const params = useParams<{ storageNoteId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.storageNoteId;

  const [note, setNote] = useState<WarehouseStorageNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [topUpDate, setTopUpDate] = useState("");
  const [topUpValue, setTopUpValue] = useState("");
  const [topUpUnit, setTopUpUnit] = useState("months");
  const [topUpPrice, setTopUpPrice] = useState("");
  const [topUpRemark, setTopUpRemark] = useState("");

  const load = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${WSN_API_URL}/${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to load Storage Note",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      setNote(data as WarehouseStorageNote);
    } catch {
      showToast({
        title: "Failed to load Storage Note",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${WSN_API_URL}/${note.id}/top-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          top_up_date: topUpDate || null,
          additional_period_value: Number(topUpValue),
          additional_period_unit: topUpUnit,
          price: Number(topUpPrice),
          remark: topUpRemark.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to top up",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      showToast({
        title: "Storage Note topped up",
        description: "The storage period has been extended.",
        variant: "success",
      });
      setTopUpOpen(false);
      await load();
    } catch {
      showToast({
        title: "Failed to top up",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openTopUp = () => {
    if (!note) return;
    if (String(note.status).toLowerCase() === "expired") {
      showToast({
        title: "Cannot top up",
        description:
          "This storage note is already expired. A top-up can only be done before expiry.",
        variant: "error",
      });
      return;
    }
    setTopUpDate("");
    setTopUpValue("");
    setTopUpUnit("months");
    setTopUpPrice("");
    setTopUpRemark("");
    setTopUpOpen(true);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!note)
    return <div className="p-10 text-center">Storage note not found.</div>;

  const isExpired = String(note.status).toLowerCase() === "expired";

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() =>
            router.push("/diredawa/inventory/warehouse-storage-notes/display")
          }
        >
          Back to Storage Notes
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">Storage Note Detail</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{note.wsn_no}</span>
            <StatusBadge status={note.status} />
          </div>
        </div>
        <div className="w-[150px]" />
      </div>

      {isExpired && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <strong>Expired.</strong> {note.periods_expired > 0
            ? `${note.periods_expired} period${note.periods_expired > 1 ? "s" : ""} past expiry.`
            : "Past expiry."}{" "}
          {note.current_expiration_fee != null && (
            <span>
              Current applicable fee:{" "}
              <span className="font-semibold">{money(note.current_expiration_fee)}</span>
            </span>
          )}
        </div>
      )}

      <div className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
          Storage Details
        </h2>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="px-4 py-2 text-muted-foreground w-52">Customer</td>
              <td className="px-4 py-2">{note.customer_name}</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">Start Date</td>
              <td className="px-4 py-2">{formatDate(note.date)}</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">Storage Period</td>
              <td className="px-4 py-2">
                {periodLabel(note.storage_period_value, note.storage_period_unit)}
              </td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">Storage Price</td>
              <td className="px-4 py-2">{money(note.storage_price)}</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">Grace Period</td>
              <td className="px-4 py-2">
                {periodLabel(note.grace_period_value, note.grace_period_unit)}
              </td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">
                Storage Expiry Date
              </td>
              <td className="px-4 py-2">{formatDate(note.storage_expiry_date)}</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">
                Current Expiry Date
              </td>
              <td className="px-4 py-2">{formatDate(note.current_expiry_date)}</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground">ECD No</td>
              <td className="px-4 py-2">{note.ECD_no || "—"}</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 text-muted-foreground align-top">Remark</td>
              <td className="px-4 py-2 whitespace-pre-wrap">
                {note.remark?.trim() ? note.remark : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
          Items ({note.items?.length ?? 0})
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2 text-left">Item Name</th>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-right">Quantity</th>
              <th className="px-4 py-2 text-left">Unit</th>
              <th className="px-4 py-2 text-right">Bags</th>
              <th className="px-4 py-2 text-right">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {(note.items ?? []).map((item, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{item.item_name}</td>
                <td className="px-4 py-2">
                  {item.code || item.internal_code || "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatQuantityDisplay(item.quantity)}
                </td>
                <td className="px-4 py-2">{item.unit_measurement || "—"}</td>
                <td className="px-4 py-2 text-right">
                  {item.bags != null ? formatQuantityDisplay(item.bags) : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatQuantityDisplay(item.remaining_quantity ?? item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border rounded-md overflow-hidden bg-white">
        <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
          Expiration Fee Tiers
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2 text-right">Tier</th>
              <th className="px-4 py-2 text-left">Period</th>
              <th className="px-4 py-2 text-right">Fee Amount</th>
            </tr>
          </thead>
          <tbody>
            {(note.expiration_fee_tiers ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">
                  No tiers defined.
                </td>
              </tr>
            ) : (
              (note.expiration_fee_tiers ?? []).map((t, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2 text-right">{t.tier_index}</td>
                  <td className="px-4 py-2">
                    {periodLabel(t.period_value, t.period_unit)}
                  </td>
                  <td className="px-4 py-2 text-right">{money(t.fee_amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(note.top_ups?.length ?? 0) > 0 && (
        <div className="border rounded-md overflow-hidden bg-white">
          <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
            Top Ups ({note.top_ups?.length})
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Additional Period</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-left">Remark</th>
              </tr>
            </thead>
            <tbody>
              {(note.top_ups ?? []).map((tu, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{formatDate(tu.top_up_date)}</td>
                  <td className="px-4 py-2">
                    {periodLabel(tu.additional_period_value, tu.additional_period_unit)}
                  </td>
                  <td className="px-4 py-2 text-right">{money(tu.price)}</td>
                  <td className="px-4 py-2">{tu.remark?.trim() || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={openTopUp} disabled={isExpired} variant="outline">
          Top Up / Extend Period
        </Button>
        {isExpired && (
          <p className="text-sm text-muted-foreground self-center">
            This note is expired and can no longer be topped up.
          </p>
        )}
      </div>

      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up / Extend Period</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTopUp} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Top Up Date</Label>
                <Input
                  type="date"
                  value={topUpDate}
                  onChange={(e) => setTopUpDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Additional Period Value</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={topUpValue}
                  onChange={(e) => setTopUpValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Additional Period Unit</Label>
                <select
                  className="w-full h-9 rounded-md border border-input px-3 py-1 text-base md:text-sm"
                  value={topUpUnit}
                  onChange={(e) => setTopUpUnit(e.target.value)}
                >
                  {PERIOD_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {PERIOD_UNIT_LABEL(u)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={topUpPrice}
                  onChange={(e) => setTopUpPrice(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Remark</Label>
                <textarea
                  className={cn(
                    "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm md:text-sm",
                  )}
                  value={topUpRemark}
                  onChange={(e) => setTopUpRemark(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTopUpOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Top Up"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
