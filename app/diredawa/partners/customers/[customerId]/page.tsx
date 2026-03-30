"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface CustomerDetail {
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

const CUSTOMER_API_URL = "/api/partners/customers";

export default function CustomerDetailPage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const customerId = params.customerId;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return;
      try {
        const res = await fetch(
          `${CUSTOMER_API_URL}/${encodeURIComponent(customerId)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        const data: unknown = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load customer",
            description:
              (data as { detail?: string })?.detail || "Please try again.",
            variant: "error",
          });
          return;
        }
        setCustomer(data as CustomerDetail);
      } catch {
        showToast({
          title: "Failed to load customer",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId, showToast]);

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
          onClick={() => router.push("/diredawa/partners/customers/display")}
        >
          Back to customers
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center">Customer details</h1>
        <div className="w-[140px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      ) : !customer ? (
        <p className="text-center text-sm text-muted-foreground">Customer not found.</p>
      ) : (
        <div className="border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <tbody>
              {row("Name", customer.name)}
              {row("Contact person", customer.contact_person)}
              {row("Email", customer.email)}
              {row("Phone", customer.phone)}
              {row("TIN number", customer.tin_number)}
              {row("Address", customer.address)}
              {row("Partner type", customer.partner_type)}
              <tr className="border-t border-border align-top">
                <td className="px-4 py-2 text-muted-foreground w-[200px]">Comments</td>
                <td className="px-4 py-2 whitespace-pre-wrap">
                  {customer.comments?.trim() ? customer.comments : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
