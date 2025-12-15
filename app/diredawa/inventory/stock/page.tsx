"use client";

import { DataTable } from "@/components/data-table";
import { columns, Items } from "./columns";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { useEffect } from "react";

const GRN_API_URL = "/api/inventory/stock";

export default function DemoPage() {

  const auth = useAuth();

  const { data, error, isLoading } = useSWR<Items[]>(GRN_API_URL, fetcher);

  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl text-center my-2 font-bold">Stocks List</h1>
      <DataTable columns={columns} data={data || [] } />
    </div>
  );
}
