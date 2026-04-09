"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { getGRNColumns, GRN } from "./columns";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TableSearch } from "@/components/table-search";

const GRN_API_URL = "/api/inventory/grn";

export default function DemoPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [editSupplierName, setEditSupplierName] = useState("");
  const [editReceivedFrom, setEditReceivedFrom] = useState("");
  const [editTruckNo, setEditTruckNo] = useState("");
  const [editPurchaseNo, setEditPurchaseNo] = useState("");
  const [editStoreName, setEditStoreName] = useState("");
  const [editStoreKeeper, setEditStoreKeeper] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editEcdNo, setEditEcdNo] = useState("");
  const [editTransporterName, setEditTransporterName] = useState("");
  const [editItems, setEditItems] = useState<
    Array<{
      item_name: string;
      quantity: number | string;
      unit_measurement: string;
      code: string;
      bags: number | string;
    }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const { data, error, isLoading, mutate } = useSWR<GRN[]>(GRN_API_URL, fetcher);

  const filteredData = useMemo(() => {
    const list = data || [];
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (g) =>
        String(g.grn_no).toLowerCase().includes(q) ||
        g.supplier_name.toLowerCase().includes(q) ||
        (g.received_from?.toLowerCase().includes(q) ?? false) ||
        (g.truck_no?.toLowerCase().includes(q) ?? false) ||
        g.purchase_no.toLowerCase().includes(q) ||
        (g.store_keeper?.toLowerCase().includes(q) ?? false) ||
        g.items.some((i) => i.item_name.toLowerCase().includes(q))
    );
  }, [data, search]);

  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  const openEdit = async (row: GRN) => {
    setSelectedGRN(row);
    setEditSupplierName(row.supplier_name);
    setEditReceivedFrom(row.received_from ?? "");
    setEditTruckNo(row.truck_no ?? "");
    setEditStoreName(row.store_name ?? "");
    setEditStoreKeeper(row.store_keeper ?? "");
    setEditPurchaseNo(row.purchase_no);
    const grnNo = String(row.grn_no);
    try {
      const res = await fetch(`${GRN_API_URL}/${encodeURIComponent(grnNo)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const detail = await res.json();
        setEditTruckNo(detail.truck_no || "");
        setEditReceivedFrom(detail.received_from || "");
        setEditStoreName(detail.store_name || "");
        setEditStoreKeeper(detail.store_keeper || "");
        setEditDate(detail.date || "");
        setEditEcdNo(detail.ECD_no || "");
        setEditTransporterName(detail.transporter_name || "");
        setEditItems(
          Array.isArray(detail.items)
            ? detail.items.map((item: Record<string, unknown>) => ({
                item_name: String(item.item_name || ""),
                quantity: Number(item.quantity || 0),
                unit_measurement: String(item.unit_measurement || ""),
                code: String(item.code || ""),
                bags: Number(item.bags || 0),
              }))
            : []
        );
      } else {
        setEditTruckNo("");
        setEditStoreName("");
        setEditStoreKeeper("");
        setEditDate("");
        setEditEcdNo("");
        setEditTransporterName("");
        setEditItems([]);
      }
    } catch {
      setEditTruckNo("");
      setEditStoreName("");
      setEditStoreKeeper("");
      setEditDate("");
      setEditEcdNo("");
      setEditTransporterName("");
      setEditItems([]);
    }
    setEditOpen(true);
  };

  const openDelete = (row: GRN) => {
    setSelectedGRN(row);
    setDeleteOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGRN) return;
    const grnNo = String(selectedGRN.grn_no);
    setSubmitting(true);
    try {
      const res = await fetch(`${GRN_API_URL}/${encodeURIComponent(grnNo)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplier_name: editSupplierName,
          received_from: editReceivedFrom || null,
          truck_no: editTruckNo || null,
          purchase_no: editPurchaseNo,
          date: editDate || null,
          store_name: editStoreName || null,
          store_keeper: editStoreKeeper || null,
          ECD_no: editEcdNo || null,
          transporter_name: editTransporterName || null,
          items: editItems.map((item) => ({
            item_name: item.item_name,
            quantity: Number(item.quantity || 0),
            unit_measurement: item.unit_measurement || "",
            code: item.code || "",
            bags: Number(item.bags || 0),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to update GRN",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "GRN updated", variant: "success" });
      setEditOpen(false);
      setSelectedGRN(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to update GRN",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGRN) return;
    const grnNo = String(selectedGRN.grn_no);
    setSubmitting(true);
    try {
      const res = await fetch(`${GRN_API_URL}/${encodeURIComponent(grnNo)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to delete GRN",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "GRN deleted", variant: "success" });
      setDeleteOpen(false);
      setSelectedGRN(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to delete GRN",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openView = (row: GRN) => {
    router.push(`/diredawa/inventory/grn/${encodeURIComponent(String(row.grn_no))}`);
  };

  const columns = getGRNColumns(openEdit, openDelete, auth?.isAdmin, openView);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-start my-4">
        <Button onClick={() => router.push("/diredawa/inventory/grn/create")}>
          Create GRN
        </Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">GRN List</h1>
      <div className="flex justify-end mb-4">
        <TableSearch value={search} onChange={setSearch} placeholder="Search GRN, supplier, items..." />
      </div>
      <DataTable columns={columns} data={filteredData} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit GRN</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Supplier Name</FieldLabel>
                <Input value={editSupplierName} onChange={(e) => setEditSupplierName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel>Received From</FieldLabel>
                <Input value={editReceivedFrom} onChange={(e) => setEditReceivedFrom(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Truck No</FieldLabel>
                <Input value={editTruckNo} onChange={(e) => setEditTruckNo(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Purchase No</FieldLabel>
                <Input value={editPurchaseNo} onChange={(e) => setEditPurchaseNo(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Store Name</FieldLabel>
                <Input value={editStoreName} onChange={(e) => setEditStoreName(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Store Keeper</FieldLabel>
                <Input value={editStoreKeeper} onChange={(e) => setEditStoreKeeper(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>ECD No</FieldLabel>
                <Input value={editEcdNo} onChange={(e) => setEditEcdNo(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Transporter Name</FieldLabel>
                <Input
                  value={editTransporterName}
                  onChange={(e) => setEditTransporterName(e.target.value)}
                />
              </Field>
            </FieldGroup>
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
                      },
                    ])
                  }
                >
                  + Add Item
                </Button>
              </div>
              {editItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input
                    placeholder="Item name"
                    value={item.item_name}
                    onChange={(e) =>
                      setEditItems((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, item_name: e.target.value } : r))
                      )
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      setEditItems((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r))
                      )
                    }
                  />
                  <Input
                    placeholder="Unit"
                    value={item.unit_measurement}
                    onChange={(e) =>
                      setEditItems((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, unit_measurement: e.target.value } : r
                        )
                      )
                    }
                  />
                  <Input
                    placeholder="Code"
                    value={item.code}
                    onChange={(e) =>
                      setEditItems((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, code: e.target.value } : r))
                      )
                    }
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Bags"
                      value={item.bags}
                      onChange={(e) =>
                        setEditItems((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, bags: e.target.value } : r))
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setEditItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete GRN</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete GRN &quot;{selectedGRN?.grn_no}&quot;? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
