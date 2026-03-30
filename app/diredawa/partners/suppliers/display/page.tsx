"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { getSupplierColumns, type Supplier } from "./columns";
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
import { cn } from "@/lib/utils";

const SUPPLIER_API_URL = "/api/partners/suppliers";

export default function DemoPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editTinNumber, setEditTinNumber] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editComments, setEditComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const { data, error, isLoading, mutate } = useSWR<Supplier[]>(SUPPLIER_API_URL, fetcher);

  const filteredData = useMemo(() => {
    const list = data || [];
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email?.toLowerCase().includes(q)) ||
        (s.phone?.toLowerCase().includes(q)) ||
        (s.address?.toLowerCase().includes(q)) ||
        (s.tin_number?.toLowerCase().includes(q)) ||
        (s.contact_person?.toLowerCase().includes(q)) ||
        (s.comments?.toLowerCase().includes(q))
    );
  }, [data, search]);

  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  const openEdit = (row: Supplier) => {
    setSelectedSupplier(row);
    setEditName(row.name);
    setEditEmail(row.email || "");
    setEditPhone(row.phone || "");
    setEditAddress(row.address || "");
    setEditTinNumber(row.tin_number || "");
    setEditContactPerson(row.contact_person || "");
    setEditComments(row.comments || "");
    setEditOpen(true);
  };

  const openDelete = (row: Supplier) => {
    setSelectedSupplier(row);
    setDeleteOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${SUPPLIER_API_URL}/${selectedSupplier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editName,
          email: editEmail || null,
          phone: editPhone || null,
          address: editAddress || null,
          tin_number: editTinNumber || null,
          contact_person: editContactPerson.trim() || null,
          comments: editComments.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to update supplier",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Supplier updated", variant: "success" });
      setEditOpen(false);
      setSelectedSupplier(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to update supplier",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${SUPPLIER_API_URL}/${selectedSupplier.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to delete supplier",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Supplier deleted", variant: "success" });
      setDeleteOpen(false);
      setSelectedSupplier(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to delete supplier",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openView = (row: Supplier) => {
    if (!row.id) return;
    router.push(`/diredawa/partners/suppliers/${encodeURIComponent(row.id)}`);
  };

  const columns = getSupplierColumns(openEdit, openDelete, auth?.isAdmin, openView);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-start my-4">
        <Button onClick={() => router.push("/diredawa/partners/suppliers/create")}>
          Create Suppliers
        </Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">Suppliers List</h1>
      <div className="flex justify-end mb-4">
        <TableSearch value={search} onChange={setSearch} placeholder="Search suppliers, name, email, phone..." />
      </div>
      <DataTable columns={columns} data={filteredData} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Address</FieldLabel>
                <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>TIN Number</FieldLabel>
                <Input value={editTinNumber} onChange={(e) => setEditTinNumber(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Contact Person</FieldLabel>
                <Input value={editContactPerson} onChange={(e) => setEditContactPerson(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Comments</FieldLabel>
                <textarea
                  className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  )}
                  value={editComments}
                  onChange={(e) => setEditComments(e.target.value)}
                  placeholder="Internal notes or comments"
                />
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
            <DialogTitle>Delete Supplier</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete &quot;{selectedSupplier?.name}&quot;? This action cannot be undone.
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
