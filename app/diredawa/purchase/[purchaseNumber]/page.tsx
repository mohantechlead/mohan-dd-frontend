"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface PurchaseItem {
  item_name: string;
  price: number;
  quantity: number;
  total_price: number;
  measurement: string;
}

interface PurchaseDetail {
  id: string;
  purchase_number: string;
  order_date: string;
  buyer: string;
  proforma_ref_no: string;
  status: string;
  items: PurchaseItem[];
}

export default function PurchaseDetailPage() {
  const params = useParams<{ purchaseNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const purchaseNumber = params.purchaseNumber;
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const res = await fetch(
          `/api/purchases/${encodeURIComponent(purchaseNumber)}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        const data: unknown = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load purchase",
            description:
              (data as { detail?: string; message?: string })?.detail ||
              (data as { detail?: string; message?: string })?.message ||
              "Please try again.",
            variant: "error",
          });
          return;
        }

        setPurchase(data as PurchaseDetail);
      } catch {
        showToast({
          title: "Failed to load purchase",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (purchaseNumber) {
      fetchPurchase();
    }
  }, [purchaseNumber, showToast]);

  const totalPrice = useMemo(() => {
    if (!purchase) return 0;
    return purchase.items.reduce((sum, item) => sum + item.total_price, 0);
  }, [purchase]);

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/purchase/display")}
        >
          Back to Purchase
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center">
          Purchase Detail
        </h1>
        <div className="w-[140px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading purchase...
        </p>
      ) : !purchase ? (
        <p className="text-center text-sm text-muted-foreground">
          Purchase not found.
        </p>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left">Purchase Number</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Total Price</th>
                  <th className="px-4 py-2 text-left">Vendor Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 font-medium">
                    {purchase.purchase_number}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(purchase.order_date).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {totalPrice.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}
                  </td>
                  <td className="px-4 py-2">{purchase.buyer}</td>
                  <td className="px-4 py-2 capitalize">{purchase.status}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                router.push(
                  `/diredawa/purchase/${purchase.purchase_number}/purchase-order`
                )
              }
            >
              Purchase Order
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/diredawa/purchase/${purchase.purchase_number}/edit`
                )
              }
            >
              Edit Purchase Order
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
