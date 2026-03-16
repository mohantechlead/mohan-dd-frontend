"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { getItemsColumns, Items } from "./columns";
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

const ITEMS_API_URL = "/api/inventory/items";

export default function DemoPage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Items | null>(null);
  const [editName, setEditName] = useState("");
  const [editHscode, setEditHscode] = useState("");
  const [editInternalCode, setEditInternalCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<Items[]>(ITEMS_API_URL, fetcher);

  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  const openEdit = (row: Items) => {
    setSelectedItem(row);
    setEditName(row.item_name);
    setEditHscode(row.hscode);
    setEditInternalCode(row.internal_code || "");
    setEditOpen(true);
  };

  const openDelete = (row: Items) => {
    setSelectedItem(row);
    setDeleteOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.item_id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${ITEMS_API_URL}/${selectedItem.item_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          item_name: editName,
          hscode: editHscode,
          internal_code: editInternalCode || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to update item",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Item updated", variant: "success" });
      setEditOpen(false);
      setSelectedItem(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to update item",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem?.item_id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${ITEMS_API_URL}/${selectedItem.item_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to delete item",
          description: (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Item deleted", variant: "success" });
      setDeleteOpen(false);
      setSelectedItem(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to delete item",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = getItemsColumns(openEdit, openDelete, auth?.isAdmin);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-start my-4">
        <Button onClick={() => router.push("/diredawa/inventory/items/create")}>
          Create Items
        </Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">Items List</h1>
      <DataTable columns={columns} data={data || []} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Item Name</FieldLabel>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel>HS Code</FieldLabel>
                <Input value={editHscode} onChange={(e) => setEditHscode(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel>Internal Code</FieldLabel>
                <Input value={editInternalCode} onChange={(e) => setEditInternalCode(e.target.value)} />
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
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete &quot;{selectedItem?.item_name}&quot;? This action cannot be undone.
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
