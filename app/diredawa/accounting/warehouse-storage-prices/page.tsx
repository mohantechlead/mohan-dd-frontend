"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import {
  WSN_API_URL,
  WSN_PRICE_URL,
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

export default function WarehouseStoragePricesPage() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<WarehouseStorageNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceOpen, setPriceOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<WarehouseStorageNote | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(WSN_API_URL, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to load", description: formatApiErrorMessage(data), variant: "error" });
        return;
      }
      setNotes(data as WarehouseStorageNote[]);
    } catch {
      showToast({ title: "Failed to load", description: "Something went wrong.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openPriceDialog = (note: WarehouseStorageNote) => {
    setSelectedNote(note);
    setPriceValue(String(note.storage_price ?? ""));
    setPriceOpen(true);
  };

  const handleSetPrice = async () => {
    if (!selectedNote) return;
    const val = Number(priceValue);
    if (!Number.isFinite(val) || val < 0) {
      showToast({ title: "Invalid price", description: "Enter a valid number.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(WSN_PRICE_URL(selectedNote.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ storage_price: val }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to set price", description: formatApiErrorMessage(data), variant: "error" });
        return;
      }
      showToast({ title: "Price set", description: `Storage price updated to ${money(val)}.`, variant: "success" });
      setPriceOpen(false);
      await load();
    } catch {
      showToast({ title: "Failed to set price", description: "Something went wrong.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Set Warehouse Storage Prices</h1>
      <p className="text-sm text-muted-foreground">
        Select a storage note and set the price for the storage period.
      </p>

      <div className="border rounded-md overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b">
              <th className="px-4 py-2 text-left">WSN No</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Period</th>
              <th className="px-4 py-2 text-right">Current Price</th>
              <th className="px-4 py-2 text-center">Price Set By</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2 font-medium">{note.wsn_no}</td>
                <td className="px-4 py-2">{note.customer_name}</td>
                <td className="px-4 py-2">
                  {note.storage_period_value} {note.storage_period_unit}
                </td>
                <td className="px-4 py-2 text-right">{money(note.storage_price)}</td>
                <td className="px-4 py-2 text-center text-muted-foreground">
                  {note.price_entered_by
                    ? `${note.price_entered_by}${note.price_entered_at ? ` on ${formatDate(note.price_entered_at)}` : ""}`
                    : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => openPriceDialog(note)}>
                    Set Price
                  </Button>
                </td>
              </tr>
            ))}
            {notes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No storage notes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={priceOpen} onOpenChange={setPriceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Set Price — {selectedNote?.wsn_no}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Storage Price</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                placeholder="e.g. 100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPrice} disabled={submitting}>
              {submitting ? "Saving..." : "Set Price"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}