"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/authProvider";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import {
  WSN_TIERS_URL,
  CURRENCIES,
  PERIOD_UNITS,
  formatDate,
  type ExpirationFeeTier,
  type WarehouseStorageNote,
} from "@/lib/warehouse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PERIOD_UNIT_LABEL = (u: string) => u.charAt(0).toUpperCase() + u.slice(1);

export default function WarehouseExpirationTiersPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [notes, setNotes] = useState<WarehouseStorageNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiersOpen, setTiersOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<WarehouseStorageNote | null>(null);
  const [tiers, setTiers] = useState<ExpirationFeeTier[]>([]);
  const [currencyValue, setCurrencyValue] = useState("ETB");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth && !(auth.isAdmin || auth.isAccounting)) router.replace("/");
  }, [auth, router]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/warehouse-storage-notes", {
        credentials: "include",
      });
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
      (note.expiration_fee_tiers ?? []).map((t) => ({
        id: t.id,
        tier_index: t.tier_index,
        period_value: t.period_value,
        period_unit: t.period_unit || "months",
        fee_amount: t.fee_amount,
      })),
    );
    setCurrencyValue(note.currency || "ETB");
    setTiersOpen(true);
  };

  const handleSetTiers = async () => {
    if (!selectedNote) return;
    const normalized = tiers
      .map((t) => ({
        tier_index: Number(t.tier_index),
        period_value: Number(t.period_value),
        period_unit: String(t.period_unit || "months"),
        fee_amount: Number(t.fee_amount),
      }))
      .filter(
        (t) =>
          Number.isFinite(t.tier_index) &&
          Number.isFinite(t.period_value) &&
          Number.isFinite(t.fee_amount),
      );
    if (normalized.length === 0) {
      showToast({
        title: "Invalid tiers",
        description: "Add at least one complete tier.",
        variant: "error",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(WSN_TIERS_URL(selectedNote.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ expiration_fee_tiers: normalized, currency: currencyValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ title: "Failed to submit tiers", description: formatApiErrorMessage(data), variant: "error" });
        return;
      }
      showToast({
        title: "Tiers submitted for approval",
        description: "They will apply once approved under Approvals → Warehouse Settings Approval.",
        variant: "success",
      });
      setTiersOpen(false);
      await load();
    } catch {
      showToast({ title: "Failed to submit tiers", description: "Something went wrong.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Warehouse Expiration Fee Tiers</h1>
      <p className="text-sm text-muted-foreground">
        Propose expiration fee tiers per storage note. Changes take effect after
        approval under Approvals → Warehouse Settings Approval.
      </p>

      <div className="border rounded-md overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b">
              <th className="px-4 py-2 text-left">WSN No</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Current Tiers</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2 font-medium">{note.wsn_no}</td>
                <td className="px-4 py-2">{note.customer_name}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {(note.expiration_fee_tiers ?? []).length > 0
                    ? (note.expiration_fee_tiers ?? [])
                        .map(
                          (t) =>
                            `#${t.tier_index}: ${t.fee_amount} ${note.currency || "ETB"} per ${t.period_value} ${t.period_unit}`,
                        )
                        .join(" · ")
                    : "—"}
                </td>
                <td className="px-4 py-2 text-center">
                  {note.pending_tiers_approval ? (
                    <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                      Pending Approval
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => openTiersDialog(note)}>
                    {note.pending_tiers_approval ? "Update Proposal" : "Set Tiers"}
                  </Button>
                </td>
              </tr>
            ))}
            {notes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No storage notes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={tiersOpen} onOpenChange={setTiersOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Propose Expiration Fee Tiers — {selectedNote?.wsn_no}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Tiers</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setTiers((prev) => [
                    ...prev,
                    {
                      tier_index: prev.length + 1,
                      period_value: 1,
                      period_unit: "months",
                      fee_amount: 0,
                    },
                  ])
                }
              >
                + Add Tier
              </Button>
            </div>
            {tiers.map((tier, idx) => (
              <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={tier.tier_index}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((t, i) =>
                        i === idx ? { ...t, tier_index: Number(e.target.value) } : t,
                      ),
                    )
                  }
                  placeholder="Tier #"
                />
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={tier.period_value}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((t, i) =>
                        i === idx ? { ...t, period_value: Number(e.target.value) } : t,
                      ),
                    )
                  }
                  placeholder="Period value"
                />
                <select
                  className="w-full h-9 rounded-md border border-input px-3 py-1 text-base md:text-sm"
                  value={tier.period_unit}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((t, i) =>
                        i === idx ? { ...t, period_unit: e.target.value } : t,
                      ),
                    )
                  }
                >
                  {PERIOD_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {PERIOD_UNIT_LABEL(u)}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={tier.fee_amount}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((t, i) =>
                        i === idx ? { ...t, fee_amount: Number(e.target.value) } : t,
                      ),
                    )
                  }
                  placeholder="Fee amount"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setTiers((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div>
              <Label>Currency</Label>
              <select
                className="w-full h-9 rounded-md border border-input px-3 py-1 text-base md:text-sm"
                value={currencyValue}
                onChange={(e) => setCurrencyValue(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {selectedNote?.price_entered_at && (
              <p className="text-xs text-muted-foreground">
                Last reviewed {formatDate(selectedNote.price_entered_at)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTiersOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetTiers} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
