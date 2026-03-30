"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface SupplierDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tin_number: string | null;
  contact_person: string | null;
  comments: string | null;
  partner_type: string;
}

const SUPPLIER_API_URL = "/api/partners/suppliers";

export default function SupplierDetailPage() {
  const params = useParams<{ supplierId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const supplierId = params.supplierId;

  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!supplierId) return;
      try {
        const res = await fetch(
          `${SUPPLIER_API_URL}/${encodeURIComponent(supplierId)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        const data: unknown = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load supplier",
            description:
              (data as { detail?: string })?.detail || "Please try again.",
            variant: "error",
          });
          return;
        }
        setSupplier(data as SupplierDetail);
      } catch {
        showToast({
          title: "Failed to load supplier",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, [supplierId, showToast]);

  const row = (label: string, value: string | null | undefined) => (
    <tr className="border-t border-border">
      <td className="px-4 py-2 text-muted-foreground w-[200px]">{label}</td>
      <td className="px-4 py-2">{value?.trim() ? value : "—"}</td>
    </tr>
  );

  return (
    <div className="max-w-3xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/partners/suppliers/display")}
        >
          Back to suppliers
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center">Supplier details</h1>
        <div className="w-[140px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      ) : !supplier ? (
        <p className="text-center text-sm text-muted-foreground">Supplier not found.</p>
      ) : (
        <div className="border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <tbody>
              {row("Name", supplier.name)}
              {row("Contact person", supplier.contact_person)}
              {row("Email", supplier.email)}
              {row("Phone", supplier.phone)}
              {row("TIN number", supplier.tin_number)}
              {row("Address", supplier.address)}
              {row("Partner type", supplier.partner_type)}
              <tr className="border-t border-border align-top">
                <td className="px-4 py-2 text-muted-foreground w-[200px]">Comments</td>
                <td className="px-4 py-2 whitespace-pre-wrap">
                  {supplier.comments?.trim() ? supplier.comments : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
