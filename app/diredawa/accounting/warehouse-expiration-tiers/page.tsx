"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import {
  WSN_API_URL,
  WSN_TIERS_URL,
  PERIOD_UNITS,
  money,
  type WarehouseStorageNote,
  type ExpirationFeeTier,
} from "@/lib/warehouse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

export default function WarehouseExpirationTiersPage() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<WarehouseStorageNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiersOpen, setTiersOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<WarehouseStorageNote | null>(null);
  const [tiers, setTiers] = useState<ExpirationFeeTier[]>([]);
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

  const openTiersDialog = (note: WarehouseStorageNote) => {
    setSelectedNote(note);
    setTiers(
      (note.expiration_fee_tiers ?? []).map((t) => ({ ...t }))
    );
    setTiersOpen(true);
  };

  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      {
        tier_index: prev.length + 1,
        period_value: 0,
        period_unit: "months",
        fee_amount: 0,
      },
    ]);
  };

  const updateTier = (index: number, field: string, value: string | number) => {
    setTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const removeTier = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTiers = async () => {
    if (!selectedNote) return;
    for (let i = 0; i < tiers.length; i++) {
      tiers[i].tier_index = i + 1;
    }
    setSubmitting(true);
    try {
      const res = await fetch(WSN_TIERS_URL(selectedNote.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          wsn_no: selectedNote.wsn_no,
          customer_name: selectedNote.customer_name,
          date: selectedNote.date,
          storage_period_value: selectedNote.storage_period_value,
          storage_period_unit: selectedNote.storage_period_unit,
          expiration_fee_tiers: tiers.map((t) => ({
            tier_index: t.tier_index,
            period_value: Number(t.period_value),
            period_unit: t.period_unit,
            fee_amount: Number(t.fee_amount),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to save tiers", description: formatApiErrorMessage(data), variant: "error" });
        return;
      }
      showToast({ title: "Tiers saved", description: `Updated ${tiers.length} expiration fee tier(s).`, variant: "success" });
      setTiersOpen(false);
      await load();
    } catch {
      showToast({ title: "Failed to save tiers", description: "Something went wrong.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Set Expiration Fee Tiers</h1>
      <p className="text-sm text-muted-foreground">
        Define the tiered fee schedule for each storage note. Tiers apply after the storage period expires.
      </p>

      <div className="border rounded-md overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b">
              <th className="px-4 py-2 text-left">WSN No</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-center">Tiers Defined</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2 font-medium">{note.wsn_no}</td>
                <td className="px-4 py-2">{note.customer_name}</td>
                <td className="px-4 py-2 text-center">
                  {note.expiration_fee_tiers?.length ?? 0}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => openTiersDialog(note)}>
                    Manage Tiers
                  </Button>
                </td>
              </tr>
            ))}
            {notes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No storage notes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={tiersOpen} onOpenChange={setTiersOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Expiration Fee Tiers — {selectedNote?.wsn_no}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Tier 1 applies for the 1st period after expiry, tier 2 for the next, and so on.
            </p>
            {tiers.length === 0 && (
              <p className="text-sm text-muted-foreground">No tiers defined. Add at least one tier.</p>
            )}
            {tiers.map((tier, index) => (
              <div
                key={index}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 rounded-lg p-4"
              >
                <div>
                  <Label>Tier #</Label>
                  <Input
                    type="number"
                    min={1}
                    value={tier.tier_index}
                    onChange={(e) => updateTier(index, "tier_index", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Period Value</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={0}
                    value={tier.period_value}
                    onChange={(e) => updateTier(index, "period_value", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Period Unit</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input px-3 py-1 text-base shadow-sm md:text-sm"
                    value={tier.period_unit}
                    onChange={(e) => updateTier(index, "period_unit", e.target.value)}
                  >
                    {PERIOD_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Fee Amount</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={0}
                      value={tier.fee_amount}
                      onChange={(e) => updateTier(index, "fee_amount", Number(e.target.value))}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeTier(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addTier}>
              + Add Tier
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTiersOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTiers} disabled={submitting}>
              {submitting ? "Saving..." : "Save Tiers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}