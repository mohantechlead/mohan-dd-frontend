"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { SearchableDropdown, type DropdownOption } from "@/components/searchable-dropdown";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import { parseDecimalQuantity, formatQuantityDisplay } from "@/lib/inventoryQuantity";
import {
  WSN_API_URL,
  WRN_API_URL,
  type WarehouseStorageNote,
} from "@/lib/warehouse";

interface ReleaseLine {
  storage_item_id: number | string;
  item_id?: string;
  item_name: string;
  code: string;
  unit_measurement: string;
  internal_code?: string | null;
  bags?: number | null;
  remaining_quantity: number;
  quantity: number | string;
  released: boolean;
}

export default function CreateReleaseNotePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    wrn_no: "",
    storage_note_id: "",
    customer_name: "",
    date: "",
    remark: "",
  });
  const [storageOptions, setStorageOptions] = useState<DropdownOption[]>([]);
  const [storageNoteDisplay, setStorageNoteDisplay] = useState("");
  const [lines, setLines] = useState<ReleaseLine[]>([]);
  const [loadingNote, setLoadingNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadNotes() {
      try {
        const res = await fetch(WSN_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as WarehouseStorageNote[];
        setStorageOptions(
          data.map((n) => ({
            value: n.id,
            display: `${n.wsn_no} — ${n.customer_name}`,
          })),
        );
      } catch {
        // ignore
      }
    }
    loadNotes();
  }, []);

  const selectStorageNote = async (id: string) => {
    setForm((p) => ({ ...p, storage_note_id: id }));
    const opt = storageOptions.find((o) => o.value === id);
    setStorageNoteDisplay(opt?.display ?? id);
    setLines([]);
    setLoadingNote(true);
    try {
      const res = await fetch(`${WSN_API_URL}/${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      const data = (await res.json()) as WarehouseStorageNote;
      if (!res.ok) {
        showToast({
          title: "Failed to load storage note",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      setForm((p) => ({ ...p, customer_name: data.customer_name }));
      setLines(
        (data.items ?? [])
          .filter((it) => (it.remaining_quantity ?? it.quantity) > 0)
          .map((it) => ({
            storage_item_id: it.item_id ?? it.code ?? "",
            item_id: it.item_id,
            item_name: it.item_name,
            code: it.code ?? "",
            unit_measurement: it.unit_measurement ?? "",
            internal_code: it.internal_code ?? null,
            bags: it.bags ?? null,
            remaining_quantity: it.remaining_quantity ?? it.quantity,
            quantity: "",
            released: false,
          })),
      );
    } catch {
      showToast({
        title: "Failed to load storage note",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setLoadingNote(false);
    }
  };

  const setLineQty = (idx: number, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, quantity: value } : l)));
  };

  const setLineReleased = (idx: number, released: boolean) => {
    if (released) {
      // When marking released, default the quantity to the remaining amount
      setLines((prev) =>
        prev.map((l, i) =>
          i === idx ? { ...l, released: true, quantity: String(l.remaining_quantity) } : l,
        ),
      );
    } else {
      setLines((prev) =>
        prev.map((l, i) => (i === idx ? { ...l, released: false } : l)),
      );
    }
  };

  const totalReleased = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const n = parseDecimalQuantity(l.quantity);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
    [lines],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storage_note_id) {
      showToast({
        title: "Storage note required",
        description: "Please select the source storage note.",
        variant: "error",
      });
      return;
    }
    const selectedLines = lines.filter((l) => {
      const q = parseDecimalQuantity(l.quantity);
      return Number.isFinite(q) && q > 0;
    });
    if (selectedLines.length === 0) {
      showToast({
        title: "No lines to release",
        description: "Add a quantity greater than zero on at least one item.",
        variant: "error",
      });
      return;
    }
    for (const l of selectedLines) {
      const q = parseDecimalQuantity(l.quantity);
      if (q > l.remaining_quantity) {
        showToast({
          title: "Quantity exceeds remaining",
          description: `"${l.item_name}" remaining is ${formatQuantityDisplay(
            l.remaining_quantity,
          )} but you entered ${formatQuantityDisplay(q)}.`,
          variant: "error",
        });
        return;
      }
    }

    const payload = {
      wrn_no: String(form.wrn_no).trim(),
      storage_note_id: form.storage_note_id,
      customer_name: String(form.customer_name).trim(),
      date: form.date || null,
      remark: String(form.remark).trim() || null,
      items: selectedLines.map((l) => ({
        storage_item_id: l.storage_item_id,
        item_name: l.item_name,
        code: l.code || null,
        quantity: parseDecimalQuantity(l.quantity),
        unit_measurement: l.unit_measurement || null,
        bags: l.bags ?? null,
        internal_code: l.internal_code ?? null,
      })),
    };

    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(WRN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const rawText = await res.text();
      let data: unknown = {};
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { detail: rawText.slice(0, 500) };
        }
      }
      if (!res.ok) {
        showToast({
          title: "Failed to create Release Note",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      showToast({
        title: "Release Note created",
        description: "The release note has been created successfully.",
        variant: "success",
      });
      router.push("/diredawa/inventory/warehouse-release-notes/display");
    } catch (error) {
      console.error("Error creating release note:", error);
      showToast({
        title: "Failed to create Release Note",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="flex justify-start mb-6">
        <Button
          onClick={() =>
            router.push("/diredawa/inventory/warehouse-release-notes/display")
          }
        >
          Display Release Notes
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-center">
        Create Release Note
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Select a storage note, then release items. Released quantities cannot
        exceed each item&apos;s remaining quantity.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>
                Storage Note <span className="text-destructive">*</span>
              </Label>
              <SearchableDropdown
                value={storageNoteDisplay}
                onChange={(val) => {
                  selectStorageNote(val);
                }}
                options={storageOptions}
                placeholder="Search storage note..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {loadingNote
                  ? "Loading items..."
                  : form.storage_note_id
                    ? `Selected: ${form.customer_name}`
                    : ""}
              </p>
            </div>
            <div>
              <Label>
                Release Note No <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.wrn_no}
                onChange={(e) => setForm((p) => ({ ...p, wrn_no: e.target.value }))}
                placeholder="e.g. WRN-001"
                required
              />
            </div>
            <div>
              <Label>
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.customer_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customer_name: e.target.value }))
                }
                readOnly={Boolean(form.storage_note_id)}
                className={form.storage_note_id ? "bg-muted/40" : ""}
                required
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Remark (optional)</Label>
              <textarea
                className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm md:text-sm"
                value={form.remark}
                onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Items to release</h2>
            <span className="text-sm text-muted-foreground">
              Released total: {formatQuantityDisplay(totalReleased)}
            </span>
          </div>

          {!form.storage_note_id ? (
            <p className="text-sm text-muted-foreground mt-4">
              Select a storage note first to load its items.
            </p>
          ) : loadingNote ? (
            <p className="text-sm text-muted-foreground mt-4">
              Loading storage note items...
            </p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">
              This storage note has no items with remaining quantity to release.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {lines.map((line, idx) => (
                <div
                  key={`${line.storage_item_id}-${idx}`}
                  className="grid grid-cols-12 gap-2 items-center bg-muted/20 rounded-lg p-3"
                >
                  <div className="col-span-3">
                    <div className="text-sm font-medium">{line.item_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {line.code || line.internal_code || "—"} /{" "}
                      {line.unit_measurement || "—"}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Remaining</Label>
                    <div className="text-sm font-semibold">
                      {formatQuantityDisplay(line.remaining_quantity)}
                      {line.bags != null ? ` (${formatQuantityDisplay(line.bags)} bags)` : ""}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Release Qty</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      max={line.remaining_quantity}
                      value={line.quantity}
                      onChange={(e) => setLineQty(idx, e.target.value)}
                    />
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-input"
                        checked={line.released}
                        onChange={(e) => setLineReleased(idx, e.target.checked)}
                      />
                      <span
                        className={
                          line.released ? "font-medium text-green-700" : "text-muted-foreground"
                        }
                      >
                        Released
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Release Note"}
          </Button>
        </div>
      </form>
    </div>
  );
}
