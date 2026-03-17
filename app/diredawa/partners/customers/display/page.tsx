"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { getCustomerColumns, Customer } from "./columns";
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

const CUSTOMER_API_URL = "/api/partners/customers";

export default function DemoPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editTinNumber, setEditTinNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const { data, error, isLoading, mutate } = useSWR<Customer[]>(CUSTOMER_API_URL, fetcher);

  const filteredData = useMemo(() => {
    const list = data || [];
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q)) ||
        (c.phone?.toLowerCase().includes(q)) ||
        (c.address?.toLowerCase().includes(q)) ||
        (c.tin_number?.toLowerCase().includes(q))
    );
  }, [data, search]);

  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  const openEdit = (row: Customer) => {
    setSelectedCustomer(row);
    setEditName(row.name);
    setEditEmail(row.email || "");
    setEditPhone(row.phone || "");
    setEditAddress(row.address || "");
    setEditTinNumber(row.tin_number || "");
    setEditOpen(true);
  };

  const openDelete = (row: Customer) => {
    setSelectedCustomer(row);
    setDeleteOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${CUSTOMER_API_URL}/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editName,
          email: editEmail || null,
          phone: editPhone || null,
          address: editAddress || null,
          tin_number: editTinNumber || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to update customer",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Customer updated", variant: "success" });
      setEditOpen(false);
      setSelectedCustomer(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to update customer",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${CUSTOMER_API_URL}/${selectedCustomer.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to delete customer",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Customer deleted", variant: "success" });
      setDeleteOpen(false);
      setSelectedCustomer(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to delete customer",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = getCustomerColumns(openEdit, openDelete, auth?.isAdmin);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-start my-4">
        <Button onClick={() => router.push("/diredawa/partners/customers/create")}>
          Create Customers
        </Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">Customers List</h1>
      <div className="flex justify-end mb-4">
        <TableSearch value={search} onChange={setSearch} placeholder="Search customers, name, email, phone..." />
      </div>
      <DataTable columns={columns} data={filteredData} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
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
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete &quot;{selectedCustomer?.name}&quot;? This action cannot be undone.
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
