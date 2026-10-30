"use client";

import { DataTable } from "@/components/data-table";
import { getStockColumns, Items } from "./columns";
import useSWR from "swr";
import { useAuth } from "@/components/authProvider";
import { useToast } from "@/components/ui/toast";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";

const GRN_API_URL = "/api/inventory/stock";

async function stockFetcher(url: string): Promise<Items[]> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as Error & {
      info?: unknown;
      status?: number;
    };
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export default function DemoPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [item, setItem] = useState("");
  const [asOfDate, setAsOfDate] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [grnNo, setGrnNo] = useState("");
  const [dnNo, setDnNo] = useState("");

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustRow, setAdjustRow] = useState<Items | null>(null);
  const [adjustReason, setAdjustReason] = useState("lost");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustBags, setAdjustBags] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    code: "",
    item: "",
    as_of_date: "",
    min_quantity: "",
    grn_no: "",
    dn_no: "",
  });

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (appliedFilters.code) params.set("code", appliedFilters.code);
    if (appliedFilters.item) params.set("item", appliedFilters.item);
    if (appliedFilters.as_of_date)
      params.set("as_of_date", appliedFilters.as_of_date);
    if (appliedFilters.min_quantity)
      params.set("min_quantity", appliedFilters.min_quantity);
    if (appliedFilters.grn_no) params.set("grn_no", appliedFilters.grn_no);
    if (appliedFilters.dn_no) params.set("dn_no", appliedFilters.dn_no);
    const query = params.toString();
    return query ? `${GRN_API_URL}?${query}` : GRN_API_URL;
  }, [appliedFilters]);

  const { data, error, isLoading, mutate } = useSWR<Items[]>(swrKey, stockFetcher);

  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  const applyFilters = () => {
    setAppliedFilters({
      code: code.trim(),
      item: item.trim(),
      as_of_date: asOfDate,
      min_quantity: minQuantity.trim(),
      grn_no: grnNo.trim(),
      dn_no: dnNo.trim(),
    });
  };

  const resetFilters = () => {
    setCode("");
    setItem("");
    setAsOfDate("");
    setMinQuantity("");
    setGrnNo("");
    setDnNo("");
    setAppliedFilters({
      code: "",
      item: "",
      as_of_date: "",
      min_quantity: "",
      grn_no: "",
      dn_no: "",
    });
  };

  const openLedgerPage = (row: Items) => {
    const params = new URLSearchParams();
    if (row.code) params.set("code", row.code);
    params.set("item", row.item_name);
    if (appliedFilters.as_of_date) {
      params.set("date_from", appliedFilters.as_of_date);
      params.set("date_to", appliedFilters.as_of_date);
    }
    router.push(`/diredawa/inventory/stock/ledger?${params.toString()}`);
  };

  const openAdjust = (row: Items) => {
    setAdjustRow(row);
    setAdjustReason("lost");
    setAdjustQuantity("");
    setAdjustBags("");
    setAdjustNote("");
    setAdjustOpen(true);
  };

  const submitAdjustment = async () => {
    if (!adjustRow) return;
    const quantity = Number(adjustQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      showToast({
        title: "Invalid quantity",
        description: "Enter an adjustment quantity greater than zero.",
        variant: "error",
      });
      return;
    }
    const bags = adjustBags.trim() ? Number(adjustBags) : null;
    if (bags !== null && (!Number.isFinite(bags) || bags < 0)) {
      showToast({
        title: "Invalid bags",
        description: "Bags must be zero or greater.",
        variant: "error",
      });
      return;
    }

    setAdjusting(true);
    try {
      const res = await fetch("/api/inventory/stock/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: adjustRow.code || adjustRow.item_name,
          item_name: adjustRow.item_name,
          quantity,
          bags,
          reason: adjustReason,
          note: adjustNote.trim() || null,
          user_id: auth?.userId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to adjust stock",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({
        title: "Stock adjusted",
        description: `${quantity} ${adjustRow.item_name} marked as ${adjustReason}.`,
        variant: "success",
      });
      setAdjustOpen(false);
      setAdjustRow(null);
      await mutate();
    } catch {
      showToast({
        title: "Failed to adjust stock",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setAdjusting(false);
    }
  };

  const columns = getStockColumns(openLedgerPage, openAdjust);

  const exportToExcel = async () => {
    if (!data || data.length === 0) return;
    const XLSX = await import("xlsx");
    const rows = data.map((row) => ({
      "Item Name": row.item_name,
      Code: row.code || "",
      "Stock Quantity": row.quantity,
      "Stock Bags": row.package,
      "GRN Nos": row.grn_nos?.join(", ") || "",
      "DN Nos": row.dn_nos?.join(", ") || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, `stock_list_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl text-center my-2 font-bold">Stocks List</h1>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-6">
        <input
          className="h-10 rounded-md border px-3 text-sm"
          placeholder="Filter by code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          className="h-10 rounded-md border px-3 text-sm"
          placeholder="Filter by item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <div className="space-y-1">
          <input
            className="h-10 w-full rounded-md border px-3 text-sm"
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            title="Show GRN/DN movements on this document date only"
          />
        </div>
        <input
          className="h-10 rounded-md border px-3 text-sm"
          type="number"
          min="0"
          step="0.01"
          placeholder="Minimum stock quantity"
          value={minQuantity}
          onChange={(e) => setMinQuantity(e.target.value)}
        />
        <input
          className="h-10 rounded-md border px-3 text-sm"
          placeholder="Filter by GRN No"
          value={grnNo}
          onChange={(e) => setGrnNo(e.target.value)}
        />
        <input
          className="h-10 rounded-md border px-3 text-sm"
          placeholder="Filter by DN No"
          value={dnNo}
          onChange={(e) => setDnNo(e.target.value)}
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyFilters}
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="h-10 rounded-md border px-4 text-sm font-medium"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={exportToExcel}
          className="h-10 rounded-md border px-4 text-sm font-medium"
        >
          Export to Excel
        </button>
      </div>
      {appliedFilters.as_of_date && (
        <p className="mb-2 text-xs text-muted-foreground">
          Showing net stock movement on document date{" "}
          <span className="font-medium text-foreground">
            {appliedFilters.as_of_date}
          </span>{" "}
          (GRN/DN with that date only).
        </p>
      )}
      <DataTable columns={columns} data={data || []} />

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock — {adjustRow?.item_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Code</p>
                <p>{adjustRow?.code || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Current Quantity
                </p>
                <p>{adjustRow ? formatQuantityDisplay(adjustRow.quantity) : "—"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="adjust-reason">Reason</Label>
              <select
                id="adjust-reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="lost">Lost</option>
                <option value="contaminated">Contaminated</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="adjust-quantity">Quantity to deduct</Label>
                <Input
                  id="adjust-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder="e.g. 25"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="adjust-bags">Bags to deduct (optional)</Label>
                <Input
                  id="adjust-bags"
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustBags}
                  onChange={(e) => setAdjustBags(e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="adjust-note">Note (optional)</Label>
              <Input
                id="adjust-note"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Reason details / reference"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustOpen(false)}
              disabled={adjusting}
            >
              Cancel
            </Button>
            <Button onClick={submitAdjustment} disabled={adjusting}>
              {adjusting ? "Adjusting..." : "Save Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
