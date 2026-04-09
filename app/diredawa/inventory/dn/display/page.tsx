"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { getDNColumns, DN } from "./columns";
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
import { OverUnderNotification } from "@/components/over-under-notification";

interface OverUnderItem {
  item_name: string;
  invoiced: number;
  delivered: number;
  variance: number;
}

const DN_API_URL = "/api/inventory/dn";

export default function DemoPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDN, setSelectedDN] = useState<DN | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editSalesNo, setEditSalesNo] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPlateNo, setEditPlateNo] = useState("");
  const [editEcdNo, setEditEcdNo] = useState("");
  const [editInvoiceNo, setEditInvoiceNo] = useState("");
  const [editGatepassNo, setEditGatepassNo] = useState("");
  const [editDispatcherName, setEditDispatcherName] = useState("");
  const [editReceiverName, setEditReceiverName] = useState("");
  const [editAuthorizedBy, setEditAuthorizedBy] = useState("");
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
  const [overUnderOpen, setOverUnderOpen] = useState(false);
  const [overUnderData, setOverUnderData] = useState<{
    dnNo: string;
    overItems: OverUnderItem[];
    underItems: OverUnderItem[];
  } | null>(null);

  const { data, error, isLoading, mutate } = useSWR<DN[]>(DN_API_URL, fetcher);

  const filteredData = useMemo(() => {
    const list = data || [];
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.dn_no.toLowerCase().includes(q) ||
        d.customer_name.toLowerCase().includes(q) ||
        d.sales_no.toLowerCase().includes(q) ||
        d.items.some((i) => i.item_name.toLowerCase().includes(q))
    );
  }, [data, search]);

  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  const openEdit = async (row: DN) => {
    setSelectedDN(row);
    setEditCustomerName(row.customer_name);
    setEditSalesNo(row.sales_no);
    try {
      const res = await fetch(`${DN_API_URL}/${encodeURIComponent(row.dn_no)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const detail = await res.json();
        setEditDate(detail.date || "");
        setEditPlateNo(detail.plate_no || "");
        setEditEcdNo(detail.ECD_no || "");
        setEditInvoiceNo(detail.invoice_no || "");
        setEditGatepassNo(detail.gatepass_no || "");
        setEditDispatcherName(detail.despathcher_name || "");
        setEditReceiverName(detail.receiver_name || "");
        setEditAuthorizedBy(detail.authorized_by || "");
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
      }
    } catch {
      // keep defaults
    }
    setEditOpen(true);
  };

  const openDelete = (row: DN) => {
    setSelectedDN(row);
    setDeleteOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDN?.dn_no) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${DN_API_URL}/${encodeURIComponent(selectedDN.dn_no)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer_name: editCustomerName,
          sales_no: editSalesNo,
          date: editDate || null,
          plate_no: editPlateNo || null,
          ECD_no: editEcdNo || null,
          invoice_no: editInvoiceNo || null,
          gatepass_no: editGatepassNo || null,
          despathcher_name: editDispatcherName || null,
          receiver_name: editReceiverName || null,
          authorized_by: editAuthorizedBy || null,
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
          title: "Failed to update Delivery Note",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Delivery Note updated", variant: "success" });
      setEditOpen(false);
      setSelectedDN(null);
      mutate();
      const resData = data as { dn_no?: string; over_items?: OverUnderItem[]; under_items?: OverUnderItem[] };
      if (
        (resData.over_items && resData.over_items.length > 0) ||
        (resData.under_items && resData.under_items.length > 0)
      ) {
        setOverUnderData({
          dnNo: resData.dn_no || selectedDN?.dn_no || "",
          overItems: resData.over_items || [],
          underItems: resData.under_items || [],
        });
        setOverUnderOpen(true);
      }
    } catch {
      showToast({
        title: "Failed to update Delivery Note",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDN?.dn_no) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${DN_API_URL}/${encodeURIComponent(selectedDN.dn_no)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to delete Delivery Note",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Delivery Note deleted", variant: "success" });
      setDeleteOpen(false);
      setSelectedDN(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to delete Delivery Note",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openView = (row: DN) => {
    router.push(`/diredawa/inventory/dn/${encodeURIComponent(row.dn_no)}`);
  };

  const columns = getDNColumns(openEdit, openDelete, auth?.isAdmin, openView);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-start my-4">
        <Button onClick={() => router.push("/diredawa/inventory/dn/create")}>
          Create Delivery Note
        </Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">Delivery Note List</h1>
      <div className="flex justify-end mb-4">
        <TableSearch value={search} onChange={setSearch} placeholder="Search delivery notes, customer, items..." />
      </div>
      <DataTable columns={columns} data={filteredData} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Delivery Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Customer Name</FieldLabel>
                <Input value={editCustomerName} onChange={(e) => setEditCustomerName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel>Sales No</FieldLabel>
                <Input value={editSalesNo} onChange={(e) => setEditSalesNo(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Plate No</FieldLabel>
                <Input value={editPlateNo} onChange={(e) => setEditPlateNo(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>ECD No</FieldLabel>
                <Input value={editEcdNo} onChange={(e) => setEditEcdNo(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Invoice No</FieldLabel>
                <Input value={editInvoiceNo} onChange={(e) => setEditInvoiceNo(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Gatepass No</FieldLabel>
                <Input value={editGatepassNo} onChange={(e) => setEditGatepassNo(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Dispatcher Name</FieldLabel>
                <Input
                  value={editDispatcherName}
                  onChange={(e) => setEditDispatcherName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Receiver Name</FieldLabel>
                <Input value={editReceiverName} onChange={(e) => setEditReceiverName(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Authorized By</FieldLabel>
                <Input value={editAuthorizedBy} onChange={(e) => setEditAuthorizedBy(e.target.value)} />
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
            <DialogTitle>Delete Delivery Note</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete delivery note &quot;{selectedDN?.dn_no}&quot;? This action cannot be undone.
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

      {overUnderData && (
        <OverUnderNotification
          open={overUnderOpen}
          onOpenChange={setOverUnderOpen}
          dnNo={overUnderData.dnNo}
          overItems={overUnderData.overItems}
          underItems={overUnderData.underItems}
        />
      )}
    </div>
  );
}
