"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface OrderDetail {
  id: string;
  order_number: string;
  order_date: string;
  buyer: string;
  proforma_ref_no: string;
  add_consignee?: string | null;
  shipper: string;
  notify_party?: string | null;
  add_notify_party?: string | null;
  country_of_origin: string;
  final_destination: string;
  port_of_loading: string;
  port_of_discharge: string;
  measurement_type: string;
  payment_terms: string;
  mode_of_transport: string;
  freight: string;
  freight_price?: number | null;
  shipment_type: string;
}

export default function EditOrderPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const orderNumber = params.orderNumber;

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
    port_of_loading: "",
    port_of_discharge: "",
    measurement_type: "",
    payment_terms: "",
    mode_of_transport: "",
    freight: "",
    freight_price: "",
    shipment_type: "",
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        const data: unknown = await res.json();
        if (!res.ok) {
          showToast({
            title: "Failed to load order",
            description:
              (data as { detail?: string; message?: string })?.detail ||
              (data as { detail?: string; message?: string })?.message ||
              "Please try again.",
            variant: "error",
          });
          return;
        }
        const detail = data as OrderDetail;
        setForm({
          order_date: detail.order_date,
          buyer: detail.buyer,
          proforma_ref_no: detail.proforma_ref_no,
          add_consignee: detail.add_consignee || "",
          shipper: detail.shipper,
          notify_party: detail.notify_party || "",
          add_notify_party: detail.add_notify_party || "",
          country_of_origin: detail.country_of_origin,
          final_destination: detail.final_destination,
          port_of_loading: detail.port_of_loading,
          port_of_discharge: detail.port_of_discharge,
          measurement_type: detail.measurement_type,
          payment_terms: detail.payment_terms,
          mode_of_transport: detail.mode_of_transport,
          freight: detail.freight,
          freight_price:
            detail.freight_price != null ? String(detail.freight_price) : "",
          shipment_type: detail.shipment_type,
        });
      } catch {
        showToast({
          title: "Failed to load order",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber) return;

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
      port_of_loading: form.port_of_loading,
      port_of_discharge: form.port_of_discharge,
      measurement_type: form.measurement_type,
      payment_terms: form.payment_terms,
      mode_of_transport: form.mode_of_transport,
      freight: form.freight,
      freight_price:
        form.freight_price !== "" ? Number(form.freight_price) : null,
      shipment_type: form.shipment_type,
    };

    try {
      setSubmitting(true);
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          (data as { detail?: string; message?: string })?.detail ||
          (data as { detail?: string; message?: string })?.message ||
          "Please try again.";
        showToast({
          title: "Failed to update order",
          description: message,
          variant: "error",
        });
        return;
      }

      showToast({
        title: "Order updated",
        description: "The order has been updated successfully.",
        variant: "success",
      });
      router.push(`/diredawa/orders/${orderNumber}`);
    } catch {
      showToast({
        title: "Failed to update order",
        description: "Something went wrong. Please try again.",
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
          onClick={() => router.push(`/diredawa/orders/${orderNumber}`)}
        >
          Back to Order Detail
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center">Edit Order</h1>
        <div className="w-[140px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading order...
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white border rounded-md p-6 text-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Order Number</label>
                <input
                  value={orderNumber}
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
                    setForm((prev) => ({
                      ...prev,
                      order_date: e.target.value,
                    }))
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
                <label className="block font-medium mb-1">
                  Proforma Ref No
                </label>
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
                <label className="block font-medium mb-1">Add Consignee</label>
                <textarea
                  rows={3}
                  value={form.add_consignee}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      add_consignee: e.target.value,
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
                    setForm((prev) => ({
                      ...prev,
                      shipper: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Notify Party</label>
                <textarea
                  rows={3}
                  value={form.notify_party}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notify_party: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Additional Notify Party
                </label>
                <textarea
                  rows={3}
                  value={form.add_notify_party}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      add_notify_party: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    Port of Loading
                  </label>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    Measurement Type
                  </label>
                  <input
                    value={form.measurement_type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        measurement_type: e.target.value,
                      }))
                    }
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Payment Terms
                  </label>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Freight</label>
                  <input
                    value={form.freight}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        freight: e.target.value,
                      }))
                    }
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Freight Price
                  </label>
                  <input
                    type="number"
                    value={form.freight_price}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        freight_price: e.target.value,
                      }))
                    }
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/diredawa/orders/${orderNumber}`)}
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

