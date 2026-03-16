"use client";

import { useState } from "react";
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
  const [submitting, setSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<DN[]>(DN_API_URL, fetcher);

  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  const openEdit = (row: DN) => {
    setSelectedDN(row);
    setEditCustomerName(row.customer_name);
    setEditSalesNo(row.sales_no);
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to update DN",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "DN updated", variant: "success" });
      setEditOpen(false);
      setSelectedDN(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to update DN",
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
          title: "Failed to delete DN",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "DN deleted", variant: "success" });
      setDeleteOpen(false);
      setSelectedDN(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to delete DN",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = getDNColumns(openEdit, openDelete, auth?.isAdmin);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-start my-4">
        <Button onClick={() => router.push("/diredawa/inventory/dn/create")}>
          Create DN
        </Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">DN List</h1>
      <DataTable columns={columns} data={data || []} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit DN</DialogTitle>
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
            <DialogTitle>Delete DN</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete DN &quot;{selectedDN?.dn_no}&quot;? This action cannot be undone.
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
