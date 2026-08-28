"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { DataTable } from "@/components/data-table";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { TableSearch } from "@/components/table-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableDropdown, type DropdownOption } from "@/components/searchable-dropdown";
import { parseInventoryItemsJson } from "@/lib/parseInventoryItems";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import { parseDecimalQuantity } from "@/lib/inventoryQuantity";
import {
  WSN_API_URL,
  PERIOD_UNITS,
  type WarehouseStorageNote,
  type ExpirationFeeTier,
} from "@/lib/warehouse";
import {
  getStorageNoteColumns,
  ExpiryBanner,
} from "./columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, compareDocumentNumberDesc } from "@/lib/utils";

type ItemDropdownOption = DropdownOption & { internalCode?: string };

interface EditItem {
  item_name: string;
  quantity: number | string;
  unit_measurement: string;
  code: string;
  bags: number | string;
  internal_code?: string;
}

const PERIOD_UNIT_LABEL = (u: string) =>
  u.charAt(0).toUpperCase() + u.slice(1);

export default function WarehouseStorageNotesDisplayPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [selected, setSelected] = useState<WarehouseStorageNote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [itemOptions, setItemOptions] = useState<ItemDropdownOption[]>([]);

  // edit state
  const [editCustomer, setEditCustomer] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editEcd, setEditEcd] = useState("");
  const [editRemark, setEditRemark] = useState("");
  const [editStorageValue, setEditStorageValue] = useState("");
  const [editStorageUnit, setEditStorageUnit] = useState("months");
  const [editStoragePrice, setEditStoragePrice] = useState("");
  const [editGraceValue, setEditGraceValue] = useState("");
  const [editGraceUnit, setEditGraceUnit] = useState("days");
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [editTiers, setEditTiers] = useState<ExpirationFeeTier[]>([]);

  // top-up state
  const [topUpDate, setTopUpDate] = useState("");
  const [topUpValue, setTopUpValue] = useState("");
  const [topUpUnit, setTopUpUnit] = useState("months");
  const [topUpPrice, setTopUpPrice] = useState("");
  const [topUpRemark, setTopUpRemark] = useState("");

  const { data, error, isLoading, mutate } = useSWR<WarehouseStorageNote[]>(
    WSN_API_URL,
    fetcher,
  );

  const filteredData = useMemo(() => {
    const list = data || [];
    const q = search.toLowerCase().trim();
    const filtered = q
      ? list.filter(
          (n) =>
            String(n.wsn_no).toLowerCase().includes(q) ||
            n.customer_name.toLowerCase().includes(q) ||
            String(n.status).toLowerCase().includes(q) ||
            (n.ECD_no?.toLowerCase().includes(q) ?? false) ||
            (n.remark?.toLowerCase().includes(q) ?? false) ||
            n.items.some((i) => i.item_name.toLowerCase().includes(q)),
        )
      : list;
    return [...filtered].sort((a, b) =>
      compareDocumentNumberDesc(a.wsn_no, b.wsn_no),
    );
  }, [data, search]);

  useEffect(() => {
    if (error?.status === 401) auth?.loginRequiredRedirect();
  }, [auth, error]);

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch("/api/inventory/items", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const parsed = parseInventoryItemsJson(data);
        setItemOptions(
          parsed.map((item, idx) => {
            const id = item.item_id?.trim();
            const name = item.item_name;
            const code = item.internal_code?.trim();
            return {
              value: id && id.length > 0 ? id : `${idx}::${name}::${code ?? ""}`,
              display: name,
              subtext: item.hscode || code || undefined,
              internalCode: code || undefined,
            };
          }),
        );
      } catch {
        // ignore
      }
    }
    loadItems();
  }, []);

  const openEdit = (row: WarehouseStorageNote) => {
    if (!auth?.isAdmin) {
      showToast({
        title: "Permission denied",
        description: "Only admin can edit storage notes.",
        variant: "error",
      });
      return;
    }
    setSelected(row);
    setEditCustomer(row.customer_name);
    setEditDate(row.date ?? "");
    setEditEcd(row.ECD_no ?? "");
    setEditRemark(typeof row.remark === "string" ? row.remark : "");
    setEditStorageValue(row.storage_period_value == null ? "" : String(row.storage_period_value));
    setEditStorageUnit(row.storage_period_unit || "months");
    setEditStoragePrice(row.storage_price == null ? "" : String(row.storage_price));
    setEditGraceValue(row.grace_period_value == null ? "" : String(row.grace_period_value));
    setEditGraceUnit(row.grace_period_unit || "days");
    setEditItems(
      (row.items ?? []).map((item) => ({
        item_name: item.item_name,
        quantity: item.quantity == null ? "" : String(item.quantity),
        unit_measurement: item.unit_measurement ?? "",
        code: item.code ?? "",
        bags: item.bags == null ? "" : String(item.bags),
        internal_code: item.internal_code ?? "",
      })),
    );
    setEditTiers(
      (row.expiration_fee_tiers ?? []).map((t) => ({
        id: t.id,
        tier_index: t.tier_index,
        period_value: t.period_value,
        period_unit: t.period_unit || "months",
        fee_amount: t.fee_amount,
      })),
    );
    setEditOpen(true);
  };

  const openDelete = (row: WarehouseStorageNote) => {
    if (!auth?.isAdmin) {
      showToast({
        title: "Permission denied",
        description: "Only admin can delete storage notes.",
        variant: "error",
      });
      return;
    }
    setSelected(row);
    setDeleteOpen(true);
  };

  const openTopUp = (row: WarehouseStorageNote) => {
    if (String(row.status).toLowerCase() === "expired") {
      showToast({
        title: "Cannot top up",
        description:
          "This storage note is already expired. A top-up can only be done before expiry.",
        variant: "error",
      });
      return;
    }
    setSelected(row);
    setTopUpDate("");
    setTopUpValue("");
    setTopUpUnit("months");
    setTopUpPrice("");
    setTopUpRemark("");
    setTopUpOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    for (const row of editItems) {
      const q = parseDecimalQuantity(row.quantity);
      if (!Number.isFinite(q) || q <= 0) {
        showToast({
          title: "Invalid quantity",
          description: "Each line needs a quantity greater than zero.",
          variant: "error",
        });
        return;
      }
    }
    const tiers = editTiers
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
    setSubmitting(true);
    try {
      const res = await fetch(`${WSN_API_URL}/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          wsn_no: selected.wsn_no,
          customer_name: editCustomer,
          date: editDate || null,
          ECD_no: editEcd || null,
          remark: editRemark.trim(),
          storage_period_value: Number(editStorageValue),
          storage_period_unit: editStorageUnit,
          storage_price: Number(editStoragePrice),
          grace_period_value: Number(editGraceValue) || 0,
          grace_period_unit: editGraceUnit,
          items: editItems.map((item) => {
            const bagsRaw = item.bags;
            const bagsParsed =
              bagsRaw === "" || bagsRaw === null || bagsRaw === undefined
                ? null
                : Number(bagsRaw);
            return {
              item_name: item.item_name,
              quantity: parseDecimalQuantity(item.quantity),
              unit_measurement: item.unit_measurement || "",
              code: item.code || "",
              internal_code: item.internal_code || "",
              bags:
                bagsParsed !== null && Number.isFinite(bagsParsed)
                  ? bagsParsed
                  : null,
            };
          }),
          expiration_fee_tiers: tiers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to update Storage Note",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      showToast({ title: "Storage Note updated", variant: "success" });
      setEditOpen(false);
      setSelected(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to update Storage Note",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${WSN_API_URL}/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to delete Storage Note",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      showToast({ title: "Storage Note deleted", variant: "success" });
      setDeleteOpen(false);
      setSelected(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to delete Storage Note",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${WSN_API_URL}/${selected.id}/top-up`, {
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
      setSelected(null);
      mutate();
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

  const openView = (row: WarehouseStorageNote) => {
    router.push(
      `/diredawa/inventory/warehouse-storage-notes/${encodeURIComponent(row.id)}`,
    );
  };

  const columns = getStorageNoteColumns(
    openEdit,
    openDelete,
    openTopUp,
    auth?.isAdmin,
    openView,
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between my-4">
        <Button
          onClick={() =>
            router.push("/diredawa/inventory/warehouse-storage-notes/create")
          }
        >
          New Storage Note
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/inventory/warehouse-expiry")}
        >
          Expired / Expiring
        </Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">Storage Notes List</h1>
      <div className="flex justify-end mb-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search WSN, customer, items..."
        />
      </div>
      <DataTable columns={columns} data={filteredData} />

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Storage Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <Input value={editCustomer} readOnly className="bg-muted/40" />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div>
                <Label>ECD No</Label>
                <Input
                  value={editEcd}
                  onChange={(e) => setEditEcd(e.target.value)}
                />
              </div>
              <div>
                <Label>Storage Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={editStoragePrice}
                  onChange={(e) => setEditStoragePrice(e.target.value)}
                />
              </div>
              <div>
                <Label>Storage Period Value</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={editStorageValue}
                  onChange={(e) => setEditStorageValue(e.target.value)}
                />
              </div>
              <div>
                <Label>Storage Period Unit</Label>
                <select
                  className="w-full h-9 rounded-md border border-input px-3 py-1 text-base md:text-sm"
                  value={editStorageUnit}
                  onChange={(e) => setEditStorageUnit(e.target.value)}
                >
                  {PERIOD_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {PERIOD_UNIT_LABEL(u)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Grace Period Value</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={editGraceValue}
                  onChange={(e) => setEditGraceValue(e.target.value)}
                />
              </div>
              <div>
                <Label>Grace Period Unit</Label>
                <select
                  className="w-full h-9 rounded-md border border-input px-3 py-1 text-base md:text-sm"
                  value={editGraceUnit}
                  onChange={(e) => setEditGraceUnit(e.target.value)}
                >
                  {PERIOD_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {PERIOD_UNIT_LABEL(u)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Remark</Label>
                <textarea
                  className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm",
                  )}
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setEditItems((prev) => [
                      ...prev,
                      {
                        item_name: "",
                        quantity: "",
                        unit_measurement: "",
                        code: "",
                        bags: "",
                        internal_code: "",
                      },
                    ])
                  }
                >
                  + Add Item
                </Button>
              </div>
              {editItems.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-5 gap-2"
                >
                  <SearchableDropdown
                    value={item.item_name}
                    tieBreakHint={String(item.internal_code ?? "").trim()}
                    onChange={(_, option) => {
                      const selected = option as ItemDropdownOption | undefined;
                      const name = selected?.display ?? item.item_name;
                      const internalCode = selected?.internalCode?.trim() ?? "";
                      setEditItems((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? { ...r, item_name: name, internal_code: internalCode }
                            : r,
                        ),
                      );
                    }}
                    options={itemOptions}
                    placeholder="Search item..."
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      setEditItems((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, quantity: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Unit"
                    value={item.unit_measurement}
                    onChange={(e) =>
                      setEditItems((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? { ...r, unit_measurement: e.target.value }
                            : r,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Code"
                    value={item.code}
                    onChange={(e) =>
                      setEditItems((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, code: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      placeholder="Bags"
                      value={item.bags}
                      onChange={(e) =>
                        setEditItems((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, bags: e.target.value } : r,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        setEditItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Expiration Fee Tiers</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setEditTiers((prev) => [
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
              {editTiers.map((tier, idx) => (
                <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={tier.tier_index}
                    onChange={(e) =>
                      setEditTiers((prev) =>
                        prev.map((t, i) =>
                          i === idx
                            ? { ...t, tier_index: Number(e.target.value) }
                            : t,
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
                      setEditTiers((prev) =>
                        prev.map((t, i) =>
                          i === idx
                            ? { ...t, period_value: Number(e.target.value) }
                            : t,
                        ),
                      )
                    }
                    placeholder="Period value"
                  />
                  <select
                    className="w-full h-9 rounded-md border border-input px-3 py-1 text-base md:text-sm"
                    value={tier.period_unit}
                    onChange={(e) =>
                      setEditTiers((prev) =>
                        prev.map((t, i) =>
                          i === idx
                            ? { ...t, period_unit: e.target.value }
                            : t,
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
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={tier.fee_amount}
                      onChange={(e) =>
                        setEditTiers((prev) =>
                          prev.map((t, i) =>
                            i === idx
                              ? { ...t, fee_amount: Number(e.target.value) }
                              : t,
                          ),
                        )
                      }
                      placeholder="Fee amount"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        setEditTiers((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {selected && <ExpiryBanner note={selected} />}

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Storage Note</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete storage note &quot;{selected?.wsn_no}
            &quot;? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top up dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up / Extend Period</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Extend the storage period for{" "}
            <span className="font-medium">{selected?.wsn_no}</span> before it
            expires.
          </p>
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
