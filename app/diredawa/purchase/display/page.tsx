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
  items: PurchaseItem[];
}

const PURCHASES_API_URL = "/api/purchases";

export default function DisplayPurchasesPage() {
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

        setPurchases(data as Purchase[]);
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
        <Button onClick={() => router.push("/diredawa/purchase/create")}>
          Create Purchase
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">
          Purchase Orders
        </h1>
      </div>

      {loading ? (
        <p>Loading purchases...</p>
      ) : purchases.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No purchases found.
        </p>
      ) : (
        <div className="border rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-4 py-2">Purchase Number</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Items</th>
                <th className="text-right px-4 py-2">Quantity</th>
                <th className="text-right px-4 py-2">Unit Price</th>
                <th className="text-right px-4 py-2">Total Price</th>
                <th className="text-left px-4 py-2">Buyer</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.flatMap((purchase) =>
                purchase.items.length > 0
                  ? purchase.items.map((item, idx) => (
                      <tr
                        key={`${purchase.id}-${idx}`}
                        className="border-t"
                      >
                        <td className="px-4 py-2">
                          {purchase.purchase_number}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(purchase.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">{item.item_name}</td>
                        <td className="px-4 py-2 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {item.price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {item.total_price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2">{purchase.buyer}</td>
                        <td className="px-4 py-2">
                          {purchase.status === "approved"
                            ? "approved"
                            : "pending"}
                        </td>
                      </tr>
                    ))
                  : [
                      <tr key={purchase.id} className="border-t">
                        <td className="px-4 py-2">
                          {purchase.purchase_number}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(purchase.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2" colSpan={5}>
                          <span className="text-xs text-muted-foreground">
                            No items
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {purchase.status === "approved"
                            ? "approved"
                            : "pending"}
                        </td>
                      </tr>,
                    ]
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

