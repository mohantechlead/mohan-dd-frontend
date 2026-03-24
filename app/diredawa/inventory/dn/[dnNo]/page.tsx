"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface DnItem {
  item_name: string;
  quantity: number;
  unit_measurement?: string | null;
}

interface OverUnderItem {
  item_name: string;
  invoiced: number;
  delivered: number;
  variance: number;
}

interface DnDetail {
  id: string;
  dn_no: string;
  customer_name: string;
  sales_no: string;
  plate_no?: string | null;
  date?: string | null;
  ECD_no?: string | null;
  invoice_no?: string | null;
  gatepass_no?: string | null;
  despathcher_name?: string | null;
  receiver_name?: string | null;
  authorized_by?: string | null;
  items: DnItem[];
  over_items?: OverUnderItem[];
  under_items?: OverUnderItem[];
}

const DN_API_URL = "/api/inventory/dn";

export default function DnDetailPage() {
  const params = useParams<{ dnNo: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const dnNo = params.dnNo;

  const [dn, setDn] = useState<DnDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDn = async () => {
      if (!dnNo) return;
      try {
        const res = await fetch(`${DN_API_URL}/${encodeURIComponent(dnNo)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data: unknown = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load Delivery Note",
            description:
              (data as { detail?: string })?.detail || "Please try again.",
            variant: "error",
          });
          return;
        }
        setDn(data as DnDetail);
      } catch {
        showToast({
          title: "Failed to load Delivery Note",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDn();
  }, [dnNo, showToast]);

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/inventory/dn/display")}
        >
          Back to DN List
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center">
          Delivery Note Detail
        </h1>
        <div className="w-[120px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading delivery note...
        </p>
      ) : !dn ? (
        <p className="text-center text-sm text-muted-foreground">
          Delivery note not found.
        </p>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left">Delivery No</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Customer Name</th>
                  <th className="px-4 py-2 text-left">Sales No</th>
                  <th className="px-4 py-2 text-left">Plate No</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 font-medium">{dn.dn_no}</td>
                  <td className="px-4 py-2">
                    {dn.date
                      ? new Date(dn.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{dn.customer_name}</td>
                  <td className="px-4 py-2">{dn.sales_no}</td>
                  <td className="px-4 py-2">{dn.plate_no || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border rounded-md overflow-hidden bg-white">
            <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
              Additional Details
            </h2>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-muted-foreground w-48">
                    Invoice No
                  </td>
                  <td className="px-4 py-2">{dn.invoice_no || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">ECD No</td>
                  <td className="px-4 py-2">{dn.ECD_no || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Gatepass No
                  </td>
                  <td className="px-4 py-2">{dn.gatepass_no || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Dispatcher Name
                  </td>
                  <td className="px-4 py-2">{dn.despathcher_name || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Receiver Name
                  </td>
                  <td className="px-4 py-2">{dn.receiver_name || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Authorized By
                  </td>
                  <td className="px-4 py-2">{dn.authorized_by || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border rounded-md overflow-hidden bg-white">
            <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
              Items ({dn.items?.length ?? 0})
            </h2>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2 text-left">Item Name</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                </tr>
              </thead>
              <tbody>
                {dn.items?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-muted-foreground text-center"
                    >
                      No items
                    </td>
                  </tr>
                ) : (
                  dn.items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.item_name}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2">
                        {item.unit_measurement || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {(dn.over_items?.length ?? 0) > 0 && (
            <div className="border rounded-md overflow-hidden bg-white border-amber-200">
              <h2 className="px-4 py-2 font-semibold bg-amber-50 border-b">
                Over Delivery
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-amber-50/60">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">Invoiced</th>
                    <th className="px-4 py-2 text-right">Delivered</th>
                    <th className="px-4 py-2 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {dn.over_items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.item_name}</td>
                      <td className="px-4 py-2 text-right">
                        {item.invoiced}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.delivered}
                      </td>
                      <td className="px-4 py-2 text-right text-amber-600">
                        +{item.variance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(dn.under_items?.length ?? 0) > 0 && (
            <div className="border rounded-md overflow-hidden bg-white border-red-200">
              <h2 className="px-4 py-2 font-semibold bg-red-50 border-b">
                Under Delivery
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-red-50/60">
                  <tr>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">Invoiced</th>
                    <th className="px-4 py-2 text-right">Delivered</th>
                    <th className="px-4 py-2 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {dn.under_items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.item_name}</td>
                      <td className="px-4 py-2 text-right">
                        {item.invoiced}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.delivered}
                      </td>
                      <td className="px-4 py-2 text-right text-red-600">
                        {item.variance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/diredawa/orders/${dn.sales_no}`)
              }
            >
              View Order
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
