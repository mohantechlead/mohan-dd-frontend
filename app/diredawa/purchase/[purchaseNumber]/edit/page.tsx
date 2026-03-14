"use client";

import { useEffect, useState } from "react";
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
  add_consignee?: string | null;
  shipper: string;
  notify_party?: string | null;
  add_notify_party?: string | null;
  country_of_origin: string;
  final_destination: string;
  conditions?: string | null;
  port_of_loading: string;
  port_of_discharge: string;
  measurement_type: string;
  payment_terms: string;
  mode_of_transport: string;
  freight: string;
  freight_price?: number | null;
  insurance?: string | null;
  shipment_type: string;
  items: PurchaseItem[];
}

export default function EditPurchasePage() {
  const params = useParams<{ purchaseNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const purchaseNumber = params.purchaseNumber;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    order_date: "",
    buyer: "",
    proforma_ref_no: "",
    add_consignee: "",
    shipper: "",
    notify_party: "",
    add_notify_party: "",
    country_of_origin: "",
    final_destination: "",
    conditions: "",
    port_of_loading: "",
    port_of_discharge: "",
    measurement_type: "",
    payment_terms: "",
    mode_of_transport: "",
    freight: "",
    freight_price: "",
    insurance: "",
    shipment_type: "",
  });
  const [items, setItems] = useState<PurchaseItem[]>([]);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const res = await fetch(
          `/api/purchases/${encodeURIComponent(purchaseNumber)}`
        );
        const data: unknown = await res.json();
        if (!res.ok) {
          showToast({
            title: "Failed to load purchase",
            description:
              (data as { detail?: string; message?: string })?.detail ||
              "Please try again.",
            variant: "error",
          });
          return;
        }
        const p = data as PurchaseDetail;
        setForm({
          order_date: p.order_date,
          buyer: p.buyer,
          proforma_ref_no: p.proforma_ref_no,
          add_consignee: p.add_consignee || "",
          shipper: p.shipper,
          notify_party: p.notify_party || "",
          add_notify_party: p.add_notify_party || "",
          country_of_origin: p.country_of_origin,
          final_destination: p.final_destination,
          conditions: p.conditions || "",
          port_of_loading: p.port_of_loading,
          port_of_discharge: p.port_of_discharge,
          measurement_type: p.measurement_type,
          payment_terms: p.payment_terms,
          mode_of_transport: p.mode_of_transport,
          freight: p.freight,
          freight_price:
            p.freight_price != null ? String(p.freight_price) : "",
          insurance: p.insurance || "",
          shipment_type: p.shipment_type,
        });
        setItems(p.items);
      } catch {
        showToast({
          title: "Failed to load purchase",
          description: "Something went wrong.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    if (purchaseNumber) fetchPurchase();
  }, [purchaseNumber, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast({
        title: "No items",
        description: "Purchase must have at least one item.",
        variant: "error",
      });
      return;
    }
    const payload = {
      proforma_ref_no: form.proforma_ref_no,
      buyer: form.buyer,
      add_consignee: form.add_consignee || null,
      order_date: form.order_date,
      shipper: form.shipper,
      notify_party: form.notify_party || null,
      add_notify_party: form.add_notify_party || null,
      country_of_origin: form.country_of_origin,
      final_destination: form.final_destination,
      conditions: form.conditions || null,
      port_of_loading: form.port_of_loading,
      port_of_discharge: form.port_of_discharge,
      measurement_type: form.measurement_type,
      payment_terms: form.payment_terms,
      mode_of_transport: form.mode_of_transport,
      freight: form.freight,
      freight_price: form.freight_price ? Number(form.freight_price) : null,
      insurance: form.insurance || null,
      shipment_type: form.shipment_type,
      items,
    };
    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/purchases/${encodeURIComponent(purchaseNumber)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data: unknown = await res.json();
      if (!res.ok) {
        showToast({
          title: "Failed to update purchase",
          description:
            (data as { detail?: string })?.detail || "Please try again.",
          variant: "error",
        });
        return;
      }
      showToast({
        title: "Purchase updated",
        description: "The purchase has been updated successfully.",
        variant: "success",
      });
      router.push(`/diredawa/purchase/${purchaseNumber}`);
    } catch {
      showToast({
        title: "Failed to update purchase",
        description: "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/diredawa/purchase/${purchaseNumber}`)}
        >
          Back to Purchase Detail
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center">
          Edit Purchase Order
        </h1>
        <div className="w-[140px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading purchase...
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white border rounded-md p-6 text-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Purchase Number</label>
              <input
                value={purchaseNumber}
                readOnly
                className="w-full border rounded-md px-3 py-2 bg-muted/40"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Order Date</label>
              <input
                type="date"
                value={form.order_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, order_date: e.target.value }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Buyer</label>
              <input
                value={form.buyer}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, buyer: e.target.value }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Proforma Ref No</label>
              <input
                value={form.proforma_ref_no}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    proforma_ref_no: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Shipper</label>
              <input
                value={form.shipper}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shipper: e.target.value }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Country of Origin
              </label>
              <input
                value={form.country_of_origin}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    country_of_origin: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Final Destination
              </label>
              <input
                value={form.final_destination}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    final_destination: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Port of Loading</label>
              <input
                value={form.port_of_loading}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    port_of_loading: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Port of Discharge
              </label>
              <input
                value={form.port_of_discharge}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    port_of_discharge: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Payment Terms</label>
              <input
                value={form.payment_terms}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    payment_terms: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Mode of Transport
              </label>
              <input
                value={form.mode_of_transport}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mode_of_transport: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Freight</label>
              <input
                value={form.freight}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, freight: e.target.value }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Shipment Type</label>
              <input
                value={form.shipment_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    shipment_type: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Items (read-only)</h2>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-2 py-1 text-left">Item</th>
                    <th className="px-2 py-1 text-right">Qty</th>
                    <th className="px-2 py-1 text-right">Price</th>
                    <th className="px-2 py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1">{it.item_name}</td>
                      <td className="px-2 py-1 text-right">{it.quantity}</td>
                      <td className="px-2 py-1 text-right">
                        {it.price.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {it.total_price.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/diredawa/purchase/${purchaseNumber}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
