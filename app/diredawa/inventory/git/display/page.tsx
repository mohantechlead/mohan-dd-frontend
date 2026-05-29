"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { DataTable } from "@/components/data-table";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { TableSearch } from "@/components/table-search";
import { getGITColumns } from "./columns";
import {
  buildGitDisplayRow,
  buildGitUnitLookupFromGrnList,
  type GITDisplayRow,
  type GITRow,
} from "@/lib/gitMtConversion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const GIT_API_URL = "/api/inventory/git";
const GRN_API_URL = "/api/inventory/grn";

export default function GITDisplayPage() {
  const auth = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [wipeOffOpen, setWipeOffOpen] = useState(false);
  const [selected, setSelected] = useState<GITDisplayRow | null>(null);

  const { data, error, isLoading, mutate } = useSWR<GITRow[]>(GIT_API_URL, fetcher);
  const { data: grnList, isLoading: grnLoading } = useSWR(GRN_API_URL, fetcher);

  const grnUnitLookup = useMemo(
    () => buildGitUnitLookupFromGrnList(grnList ?? []),
    [grnList],
  );

  const displayRows = useMemo(
    () => (data || []).map((r) => buildGitDisplayRow(r, grnUnitLookup)),
    [data, grnUnitLookup],
  );

  useEffect(() => {
    if (error?.status === 401) auth?.loginRequiredRedirect();
  }, [auth, error]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = !q
      ? displayRows
      : displayRows.filter((r) =>
      [
        r.grn_no,
        r.purchase_no,
        r.item_name,
        r.code || "",
        r.variance_type,
        r.grn_unit_label,
      ].some((v) => String(v).toLowerCase().includes(q)),
    );

    const extractPoNumber = (value: string) => {
      const matches = String(value ?? "").match(/\d+/g);
      if (!matches || matches.length === 0) return -Infinity;
      const n = Number(matches[matches.length - 1]);
      return Number.isFinite(n) ? n : -Infinity;
    };

    return [...rows].sort((a, b) => {
      const aNum = extractPoNumber(a.purchase_no);
      const bNum = extractPoNumber(b.purchase_no);
      if (bNum !== aNum) return bNum - aNum;
      return String(b.purchase_no ?? "").localeCompare(String(a.purchase_no ?? ""));
    });
  }, [displayRows, search]);

  const onWipeOff = (row: GITDisplayRow) => {
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

  const columns = getGITColumns(onWipeOff, auth?.canManageRecords);

  if (isLoading || grnLoading) return <div>Loading...</div>;
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
            Confirmation required. Wipe off variance for item "{selected?.item_name}"?
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

