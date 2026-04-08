"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { DataTable } from "@/components/data-table";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { TableSearch } from "@/components/table-search";
import { getGITColumns, GITRow } from "./columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const GIT_API_URL = "/api/inventory/git";

export default function GITDisplayPage() {
  const auth = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [wipeOffOpen, setWipeOffOpen] = useState(false);
  const [selected, setSelected] = useState<GITRow | null>(null);

  const { data, error, isLoading, mutate } = useSWR<GITRow[]>(GIT_API_URL, fetcher);

  useEffect(() => {
    if (error?.status === 401) auth?.loginRequiredRedirect();
  }, [auth, error]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data || [];
    return (data || []).filter((r) =>
      [
        r.grn_no,
        r.purchase_no,
        r.item_name,
        r.code || "",
        r.variance_type,
      ].some((v) => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);

  const onWipeOff = (row: GITRow) => {
    setSelected(row);
    setWipeOffOpen(true);
  };

  const confirmWipeOff = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${GIT_API_URL}/${selected.id}/wipe-off`, {
        method: "POST",
        credentials: "include",
      });
      const payload = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to wipe off variance",
          description: payload?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Variance wiped off", variant: "success" });
      setWipeOffOpen(false);
      setSelected(null);
      mutate();
    } catch {
      showToast({
        title: "Failed to wipe off variance",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = getGITColumns(onWipeOff, auth?.isAdmin);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl text-center my-2 font-bold">GIT List</h1>
      <div className="flex justify-end mb-4">
        <TableSearch value={search} onChange={setSearch} placeholder="Search GIT..." />
      </div>
      <DataTable columns={columns} data={filtered} />

      <Dialog open={wipeOffOpen} onOpenChange={setWipeOffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Wipe Off</DialogTitle>
          </DialogHeader>
          <p>
            Admin confirmation required. Wipe off variance for item "{selected?.item_name}"?
            This will set variance back to zero.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setWipeOffOpen(false)}>Cancel</Button>
            <Button onClick={confirmWipeOff} disabled={submitting}>
              {submitting ? "Confirming..." : "Confirm Wipe Off"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

