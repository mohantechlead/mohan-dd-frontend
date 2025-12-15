"use client";

import { DataTable } from "@/components/data-table";
import { columns, Items } from "./columns";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const GRN_API_URL = "/api/inventory/items";

export default function DemoPage() {
  const router =  useRouter();
  const auth = useAuth();

  // useSWR fetches data on the client
  const { data, error, isLoading } = useSWR<Items[]>(GRN_API_URL, fetcher);

  // Redirect to login if unauthorized
  useEffect(() => {
    if (error?.status === 401) {
      auth?.loginRequiredRedirect();
    }
  }, [auth, error]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {JSON.stringify(error.info || error)}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-start my-4">
      <Button onClick={() => router.push('/diredawa/inventory/items/create')}>Create Items</Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">Items List</h1>
      <DataTable columns={columns} data={data || [] } />
    </div>
  );
}
