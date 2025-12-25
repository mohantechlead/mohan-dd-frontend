"use client";

import { DataTable } from "@/components/data-table";
import { columns, Supplier } from "./columns";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useAuth } from "@/components/authProvider";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const SUPPLIER_API_URL = "/api/partners/suppliers";

export default function DemoPage() {
  const router =  useRouter();
  const auth = useAuth();

  // useSWR fetches data on the client
  const { data, error, isLoading } = useSWR<Supplier[]>(SUPPLIER_API_URL, fetcher);

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
      <Button onClick={() => router.push('/diredawa/partners/suppliers/create')}>Create Suppliers</Button>
      </div>
      <h1 className="text-2xl text-center my-2 font-bold">Suppliers List</h1>
      <DataTable columns={columns} data={data || [] } />
    </div>
  );
}
