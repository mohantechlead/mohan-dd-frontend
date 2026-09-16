"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import {
  WSN_API_URL,
  WSN_ENTRIES_URL,
  formatDate,
  type WarehouseStorageNote,
  type WarehouseStorageEntryItem,
} from "@/lib/warehouse";

interface EntryItemForm {
  storage_item_id: number;
  item_name: string;
  code: string | null;
  quantity: string;
  bags: string;
  max_quantity: number;
  already_entered: number;
}

export default function CreateStorageEntryPage() {
  const params = useParams<{ storageNoteId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const noteId = params.storageNoteId;

  const [note, setNote] = useState<WarehouseStorageNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [entryDate, setEntryDate] = useState("");
  const [remark, setRemark] = useState("");
  const [items, setItems] = useState<EntryItemForm[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!noteId) return;
      try {
        const res = await fetch(`${WSN_API_URL}/${encodeURIComponent(noteId)}`, {
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
        const n = data as WarehouseStorageNote;
        setNote(n);
        // Compute already-entered quantities per item from existing entries
        const enteredMap: Record<number, number> = {};
        for (const entry of n.entries || []) {
          for (const ei of entry.items || []) {
            enteredMap[ei.storage_item_id] = (enteredMap[ei.storage_item_id] || 0) + ei.quantity;
          }
        }
        setItems(
          n.items.map((item) => ({
            storage_item_id: item.id ?? 0,
            item_name: item.item_name,
            code: item.code || null,
            quantity: "",
            bags: item.bags?.toString() || "",
            max_quantity: item.quantity,
            already_entered: enteredMap[item.id ?? 0] || 0,
          }))
        );
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const updateItem = (index: number, field: keyof EntryItemForm, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;

    const entryItems = items
      .filter((item) => item.quantity && Number(item.quantity) > 0)
      .map((item) => ({
        storage_item_id: item.storage_item_id,
        quantity: Number(item.quantity),
        bags: item.bags ? Number(item.bags) : null,
      }));

    if (entryItems.length === 0) {
      showToast({
        title: "No items",
        description: "Please enter quantities for at least one item.",
        variant: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${WSN_ENTRIES_URL(noteId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          entry_date: entryDate,
          remark: remark.trim() || null,
          items: entryItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to create entry",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      showToast({
        title: "Entry created",
        description: "The delivery entry has been recorded.",
        variant: "success",
      });
      router.push(`/diredawa/inventory/warehouse-storage-notes/${noteId}`);
    } catch {
      showToast({
        title: "Failed to create entry",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!note)
    return <div className="p-10 text-center">Storage note not found.</div>;

  return (
    <div className="max-w-4xl mx-auto mt-6 space-y-6">
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
          <h1 className="text-2xl font-bold">Record Delivery Entry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {note.wsn_no} — {note.customer_name}
          </p>
        </div>
        <div className="w-[150px]" />
      </div>

      <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        <strong>Flexible Entry:</strong> Record items as they arrive. You can
        create multiple entries for this storage note with different dates.
      </div>

      {/* CSV Upload */}
      <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        <strong>Bulk Upload:</strong> Upload a CSV file with columns: <code>item_name</code>, <code>quantity</code>, <code>bags</code> (optional).
        <div className="mt-2">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const text = ev.target?.result as string;
                const lines = text.split("\n").filter((l) => l.trim());
                const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
                const nameIdx = header.indexOf("item_name");
                const qtyIdx = header.indexOf("quantity");
                const bagsIdx = header.indexOf("bags");
                if (nameIdx === -1 || qtyIdx === -1) {
                  showToast({ title: "Invalid CSV", description: "Must have item_name and quantity columns.", variant: "error" });
                  return;
                }
                const updated = [...items];
                for (let i = 1; i < lines.length; i++) {
                  const cols = lines[i].split(",").map((c) => c.trim());
                  const csvName = cols[nameIdx];
                  const csvQty = parseFloat(cols[qtyIdx]);
                  if (!csvName || isNaN(csvQty)) continue;
                  const idx = updated.findIndex((u) => u.item_name.toLowerCase() === csvName.toLowerCase());
                  if (idx !== -1) {
                    updated[idx] = { ...updated[idx], quantity: String(csvQty), bags: bagsIdx !== -1 ? cols[bagsIdx] || "" : updated[idx].bags };
                  }
                }
                setItems(updated);
                showToast({ title: "CSV imported", description: "Quantities updated from CSV.", variant: "success" });
              };
              reader.readAsText(file);
            }}
            className="text-sm"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border rounded-md overflow-hidden bg-white">
          <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
            Entry Details
          </h2>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entry_date">Entry Date *</Label>
              <Input
                id="entry_date"
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="remark">Remark</Label>
              <Input
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Optional remark"
              />
            </div>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden bg-white">
          <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
            Items
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2 text-left">Item Name</th>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-right">Total Agreed</th>
                <th className="px-4 py-2 text-right">Already Entered</th>
                <th className="px-4 py-2 text-right">Can Enter</th>
                <th className="px-4 py-2 text-right">Enter Quantity *</th>
                <th className="px-4 py-2 text-right">Bags</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const canEnter = item.max_quantity - item.already_entered;
                return (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="px-4 py-2">{item.item_name}</td>
                    <td className="px-4 py-2">{item.code || "—"}</td>
                    <td className="px-4 py-2 text-right">
                      {item.max_quantity}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {item.already_entered}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium ${canEnter <= 0 ? "text-green-600" : ""}`}>
                      {canEnter}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Input
                        type="number"
                        min="0"
                        max={canEnter}
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", e.target.value)
                        }
                        className="w-24 text-right"
                        placeholder="0"
                        disabled={canEnter <= 0}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.bags}
                        onChange={(e) => updateItem(idx, "bags", e.target.value)}
                        className="w-20 text-right"
                        placeholder="—"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                `/diredawa/inventory/warehouse-storage-notes/${noteId}`
              )
            }
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}
