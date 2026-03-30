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
      } else {
        setEditTruckNo("");
        setEditStoreName("");
        setEditStoreKeeper("");
      }
    } catch {
      setEditTruckNo("");
      setEditStoreName("");
      setEditStoreKeeper("");
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
          store_name: editStoreName || null,
          store_keeper: editStoreKeeper || null,
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
        <DialogContent>
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
                <FieldLabel>Store Name</FieldLabel>
                <Input value={editStoreName} onChange={(e) => setEditStoreName(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Store Keeper</FieldLabel>
                <Input value={editStoreKeeper} onChange={(e) => setEditStoreKeeper(e.target.value)} />
              </Field>
            </FieldGroup>
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
