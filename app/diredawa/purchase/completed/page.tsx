"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface PurchaseItem {
  item_name: string;
  price: number;
  quantity: number;
  total_price: number;
  measurement: string;
}

interface Purchase {
  id: string;
  purchase_number: string;
  order_date: string;
  buyer: string;
  proforma_ref_no: string;
  status: string;
  completed_by?: string | null;
  completed_date?: string | null;
  status_remark?: string | null;
  items: PurchaseItem[];
}

const PURCHASES_API_URL = "/api/purchases";

export default function CompletedPurchasesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(PURCHASES_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load purchases",
            description:
              (data as any)?.detail ||
              (data as any)?.message ||
              "Please try again.",
            variant: "error",
          });
          return;
        }

        const completed = (data as Purchase[]).filter((p) => p.status === "completed");
        setPurchases(completed);
      } catch (error) {
        showToast({
          title: "Failed to load purchases",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [showToast]);

  return (
    <div className="max-w-5xl mx-auto mt-4 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/diredawa/purchase/display")}>
          Back to Purchase
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">
          Completed Purchases
        </h1>
      </div>

      {loading ? (
        <p>Loading completed purchases...</p>
      ) : purchases.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No completed purchases found.
        </p>
      ) : (
        <div className="border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-4 py-2">Purchase Number</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-right px-4 py-2">Total Price</th>
                <th className="text-left px-4 py-2">Vendor Name</th>
                <th className="text-left px-4 py-2">Completed By</th>
                <th className="text-left px-4 py-2">Remark</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const totalPrice = purchase.items.reduce(
                  (sum, item) => sum + item.total_price,
                  0
                );
                return (
                  <tr key={purchase.id} className="border-t">
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() =>
                          router.push(
                            `/diredawa/purchase/${purchase.purchase_number}`
                          )
                        }
                      >
                        {purchase.purchase_number}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(purchase.order_date).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {totalPrice.toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}
                    </td>
                    <td className="px-4 py-2">{purchase.buyer}</td>
                    <td className="px-4 py-2">
                      {purchase.completed_by ?? "—"}
                    </td>
                    <td className="px-4 py-2 max-w-[200px] truncate" title={purchase.status_remark ?? ""}>
                      {purchase.status_remark ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
