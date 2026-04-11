"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatQuantityDisplay } from "@/lib/inventoryQuantity";

interface GrnItem {
  code?: string | null;
  item_name: string;
  quantity: number;
  unit_measurement?: string | null;
  internal_code?: string | null;
  bags?: number | null;
}

interface GrnDetail {
  id: string;
  grn_no: string;
  supplier_name: string;
  purchase_id?: string | null;
  received_from?: string | null;
  truck_no?: string | null;
  total_quantity?: number | null;
  store_name?: string | null;
  store_keeper?: string | null;
  purchase_no: string;
  date?: string | null;
  ECD_no?: string | null;
  transporter_name?: string | null;
  remark?: string | null;
  items: GrnItem[];
}

const GRN_API_URL = "/api/inventory/grn";

export default function GrnDetailPage() {
  const params = useParams<{ grnNo: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const grnNo = params.grnNo;

  const [grn, setGrn] = useState<GrnDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrn = async () => {
      if (!grnNo) return;
      try {
        const res = await fetch(`${GRN_API_URL}/${encodeURIComponent(grnNo)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data: unknown = await res.json();

        if (!res.ok) {
          showToast({
            title: "Failed to load GRN",
            description:
              (data as { detail?: string })?.detail || "Please try again.",
            variant: "error",
          });
          return;
        }
        setGrn(data as GrnDetail);
      } catch {
        showToast({
          title: "Failed to load GRN",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchGrn();
  }, [grnNo, showToast]);

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/diredawa/inventory/grn/display")}
        >
          Back to GRN List
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center">
          GRN Detail
        </h1>
        <div className="w-[120px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading GRN...
        </p>
      ) : !grn ? (
        <p className="text-center text-sm text-muted-foreground">
          GRN not found.
        </p>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left">GRN No</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Supplier Name</th>
                  <th className="px-4 py-2 text-left">Purchase No</th>
                  <th className="px-4 py-2 text-left">Truck No</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 font-medium">{grn.grn_no}</td>
                  <td className="px-4 py-2">
                    {grn.date
                      ? new Date(grn.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{grn.supplier_name}</td>
                  <td className="px-4 py-2">{grn.purchase_no}</td>
                  <td className="px-4 py-2">{grn.truck_no || "—"}</td>
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
                  <td className="px-4 py-2 text-muted-foreground w-48">Received From</td>
                  <td className="px-4 py-2">{grn.received_from || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground w-48">Total Quantity</td>
                  <td className="px-4 py-2">{formatQuantityDisplay(grn.total_quantity ?? null)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-muted-foreground w-48">
                    ECD No
                  </td>
                  <td className="px-4 py-2">{grn.ECD_no || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Transporter Name
                  </td>
                  <td className="px-4 py-2">{grn.transporter_name || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Store Name
                  </td>
                  <td className="px-4 py-2">{grn.store_name || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground">
                    Store Keeper
                  </td>
                  <td className="px-4 py-2">{grn.store_keeper || "—"}</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-muted-foreground align-top">
                    Remark
                  </td>
                  <td className="px-4 py-2 whitespace-pre-wrap">
                    {grn.remark?.trim() ? grn.remark : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border rounded-md overflow-hidden bg-white">
            <h2 className="px-4 py-2 font-semibold bg-muted/60 border-b">
              Items ({grn.items?.length ?? 0})
            </h2>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2 text-left">Item Name</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-left">Unit</th>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-right">Bags</th>
                </tr>
              </thead>
              <tbody>
                {grn.items?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-muted-foreground text-center"
                    >
                      No items
                    </td>
                  </tr>
                ) : (
                  grn.items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{item.item_name}</td>
                      <td className="px-4 py-2 text-right">{formatQuantityDisplay(item.quantity)}</td>
                      <td className="px-4 py-2">{item.unit_measurement || "—"}</td>
                      <td className="px-4 py-2">{item.code || item.internal_code || "—"}</td>
                      <td className="px-4 py-2 text-right">
                        {item.bags != null ? formatQuantityDisplay(item.bags) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
