"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { DataTable } from "@/components/data-table";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { TableSearch } from "@/components/table-search";
import { WRN_API_URL, type WarehouseReleaseNote } from "@/lib/warehouse";
import { getReleaseNoteColumns } from "./columns";
import { compareDocumentNumberDesc } from "@/lib/utils";

export default function ReleaseNotesDisplayPage() {
  const router = useRouter();
  const auth = useAuth();
  const [search, setSearch] = useState("");

  const { data, error, isLoading } = useSWR<WarehouseReleaseNote[]>(
    WRN_API_URL,
    fetcher,
  );

  const filteredData = useMemo(() => {
    const list = data || [];
    const q = search.toLowerCase().trim();
    const filtered = q
      ? list.filter(
          (n) =>
            String(n.wrn_no).toLowerCase().includes(q) ||
            String(n.wsn_no ?? "").toLowerCase().includes(q) ||
            n.customer_name.toLowerCase().includes(q) ||
            n.items.some((i) => i.item_name.toLowerCase().includes(q)),
        )
      : list;
    return [...filtered].sort((a, b) =>
      compareDocumentNumberDesc(a.wrn_no, b.wrn_no),
    );
  }, [data, search]);

  useEffect(() => {
    if (error?.status === 401) auth?.loginRequiredRedirect();
  }, [auth, error]);

  const openView = (row: WarehouseReleaseNote) => {
    router.push(
      `/diredawa/inventory/warehouse-release-notes/${encodeURIComponent(row.id)}`,
    );
  };

  const columns = getReleaseNoteColumns(openView);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-start my-4">
        <Button
          onClick={() =>
            router.push("/diredawa/inventory/warehouse-release-notes/create")
          }
        >
          New Release Note
        </Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">Release Notes List</h1>
      <div className="flex justify-end mb-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search WRN, customer, items..."
        />
      </div>
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
