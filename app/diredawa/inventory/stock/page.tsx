"use client";

import { DataTable } from "@/components/data-table";
import { columns, Items } from "./columns";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { useEffect, useMemo, useState } from "react";

const GRN_API_URL = "/api/inventory/stock";

export default function DemoPage() {
  const auth = useAuth();
  const [code, setCode] = useState("");
  const [item, setItem] = useState("");
  const [asOfDate, setAsOfDate] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [grnNo, setGrnNo] = useState("");
  const [dnNo, setDnNo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    code: "",
    item: "",
    as_of_date: "",
    min_quantity: "",
    grn_no: "",
    dn_no: "",
  });

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (appliedFilters.code) params.set("code", appliedFilters.code);
    if (appliedFilters.item) params.set("item", appliedFilters.item);
    if (appliedFilters.as_of_date) params.set("as_of_date", appliedFilters.as_of_date);
    if (appliedFilters.min_quantity) params.set("min_quantity", appliedFilters.min_quantity);
    if (appliedFilters.grn_no) params.set("grn_no", appliedFilters.grn_no);
    if (appliedFilters.dn_no) params.set("dn_no", appliedFilters.dn_no);
    const query = params.toString();
    return query ? `${GRN_API_URL}?${query}` : GRN_API_URL;
  }, [appliedFilters]);

  const { data, error, isLoading } = useSWR<Items[]>(swrKey, fetcher);

  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  const applyFilters = () => {
    setAppliedFilters({
      code: code.trim(),
      item: item.trim(),
      as_of_date: asOfDate,
      min_quantity: minQuantity.trim(),
      grn_no: grnNo.trim(),
      dn_no: dnNo.trim(),
    });
  };

  const resetFilters = () => {
    setCode("");
    setItem("");
    setAsOfDate("");
    setMinQuantity("");
    setGrnNo("");
    setDnNo("");
    setAppliedFilters({
      code: "",
      item: "",
      as_of_date: "",
      min_quantity: "",
      grn_no: "",
      dn_no: "",
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl text-center my-2 font-bold">Stocks List</h1>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-7">
        <input
          className="h-10 rounded-md border px-3 text-sm"
          placeholder="Filter by code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          className="h-10 rounded-md border px-3 text-sm"
          placeholder="Filter by item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <input
          className="h-10 rounded-md border px-3 text-sm"
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
        />
        <input
          className="h-10 rounded-md border px-3 text-sm"
          type="number"
          min="0"
          step="0.01"
          placeholder="Minimum stock quantity"
          value={minQuantity}
          onChange={(e) => setMinQuantity(e.target.value)}
        />
        <input
          className="h-10 rounded-md border px-3 text-sm"
          placeholder="Filter by GRN No"
          value={grnNo}
          onChange={(e) => setGrnNo(e.target.value)}
        />
        <input
          className="h-10 rounded-md border px-3 text-sm"
          placeholder="Filter by DN No"
          value={dnNo}
          onChange={(e) => setDnNo(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-md border px-4 text-sm font-medium"
          >
            Reset
          </button>
        </div>
      </div>
      <DataTable columns={columns} data={data || []} />
    </div>
  );
}
