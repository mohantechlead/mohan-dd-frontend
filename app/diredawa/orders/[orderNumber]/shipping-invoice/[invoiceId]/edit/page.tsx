"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";
const ITEMS_API_URL = "/api/inventory/items";

interface ShippingItemState {
  item_name: string;
  price: number;
  quantity: number;
  total_price: number;
  measurement: string;
  bags: string;
  net_weight: string;
  gross_weight: string;
}

interface ShippingInvoiceDetail {
  id: string;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  waybill_number?: string | null;
  customer_order_number: string;
  container_number?: string | null;
  vessel?: string | null;
  invoice_remark?: string | null;
  packing_list_remark?: string | null;
  waybill_remark?: string | null;
  bill_of_lading_remark?: string | null;
  items: {
    item_name: string;
    price: number;
    quantity: number;
    total_price: number;
    measurement: string;
    bags?: number | null;
    net_weight?: number | null;
    gross_weight?: number | null;
  }[];
}

export default function EditShippingInvoicePage() {
  const params = useParams<{ orderNumber: string; invoiceId: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const { orderNumber, invoiceId } = params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    invoice_date: "",
    waybill_number: "",
    customer_order_number: "",
    container_number: "",
    vessel: "",
    invoice_remark: "",
    packing_list_remark: "",
    waybill_remark: "",
    bill_of_lading_remark: "",
  });

  const [shippingItems, setShippingItems] = useState<ShippingItemState[]>([]);
  const [shippingItem, setShippingItem] = useState<ShippingItemState>({
    item_name: "",
    price: 0,
    quantity: 0,
    total_price: 0,
    measurement: "",
    bags: "",
    net_weight: "",
    gross_weight: "",
  });

  const [itemOptions, setItemOptions] = useState<
    { item_name: string; hscode: string; internal_code: string | null }[]
  >([]);
  const [itemQuery, setItemQuery] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoiceRes, itemsRes] = await Promise.all([
          fetch(`${SHIPPING_INVOICES_API_URL}/${invoiceId}`),
          fetch(ITEMS_API_URL),
        ]);

        if (invoiceRes.ok) {
          const invData = (await invoiceRes.json()) as ShippingInvoiceDetail;
          setShippingForm({
            invoice_date: invData.invoice_date,
            waybill_number: invData.waybill_number || "",
            customer_order_number: invData.customer_order_number,
            container_number: invData.container_number || "",
            vessel: invData.vessel || "",
            invoice_remark: invData.invoice_remark || "",
            packing_list_remark: invData.packing_list_remark || "",
            waybill_remark: invData.waybill_remark || "",
            bill_of_lading_remark: invData.bill_of_lading_remark || "",
          });
          setShippingItems(
            invData.items.map((it) => ({
              item_name: it.item_name,
              price: it.price,
              quantity: it.quantity,
              total_price: it.total_price,
              measurement: it.measurement,
              bags: it.bags != null ? String(it.bags) : "",
              net_weight: it.net_weight != null ? String(it.net_weight) : "",
              gross_weight:
                it.gross_weight != null ? String(it.gross_weight) : "",
            }))
          );
        }

        if (itemsRes.ok) {
          const itemsData =
            (await itemsRes.json()) as {
              item_name: string;
              hscode: string;
              internal_code: string | null;
            }[];
          setItemOptions(itemsData);
        }
      } catch {
        showToast({
          title: "Failed to load invoice",
          description: "Something went wrong. Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchData();
    }
  }, [invoiceId, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !invoiceId) return;

    if (!shippingForm.invoice_date) {
      showToast({
        title: "Invoice date required",
        description: "Please select an invoice date.",
        variant: "error",
      });
      return;
    }
    if (!shippingForm.customer_order_number.trim()) {
      showToast({
        title: "Customer order number required",
        description: "Please enter a customer order number before submitting.",
        variant: "error",
      });
      return;
    }
    if (shippingItems.length === 0) {
      showToast({
        title: "No items added",
        description: "Please add at least one item.",
        variant: "error",
      });
      return;
    }

    const payload = {
      invoice_date: shippingForm.invoice_date,
      waybill_number: shippingForm.waybill_number || null,
      customer_order_number: shippingForm.customer_order_number.trim(),
      container_number: shippingForm.container_number || null,
      vessel: shippingForm.vessel || null,
      invoice_remark: shippingForm.invoice_remark || null,
      packing_list_remark: shippingForm.packing_list_remark || null,
      waybill_remark: shippingForm.waybill_remark || null,
      bill_of_lading_remark: shippingForm.bill_of_lading_remark || null,
      items: shippingItems.map((it) => ({
        item_name: it.item_name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 0,
        total_price: Number(it.total_price) || 0,
        measurement: it.measurement,
        bags: it.bags ? Number(it.bags) : null,
        net_weight: it.net_weight ? Number(it.net_weight) : null,
        gross_weight: it.gross_weight ? Number(it.gross_weight) : null,
      })),
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${SHIPPING_INVOICES_API_URL}/${invoiceId}`, {
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
          title: "Failed to update invoice",
          description: message,
          variant: "error",
        });
        return;
      }

      showToast({
        title: "Invoice updated",
        description: "The shipping invoice has been updated successfully.",
        variant: "success",
      });

      router.push(`/diredawa/orders/${orderNumber}`);
    } catch {
      showToast({
        title: "Failed to update invoice",
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
        <h1 className="text-2xl font-bold flex-1 text-center">
          Edit Shipping Invoice
        </h1>
        <div className="w-[140px]" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          Loading invoice...
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white border rounded-md p-6"
        >
          {/* Reuse layout from add shipping details, but without invoice_number (not editable) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                <label className="block font-medium mb-1">Waybill Number</label>
                <input
                  value={shippingForm.waybill_number}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      waybill_number: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Customer Order Number *
                </label>
                <input
                  value={shippingForm.customer_order_number}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      customer_order_number: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Invoice Remark
                </label>
                <textarea
                  rows={3}
                  value={shippingForm.invoice_remark}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      invoice_remark: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Packing List Remark
                </label>
                <textarea
                  rows={3}
                  value={shippingForm.packing_list_remark}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      packing_list_remark: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={shippingForm.invoice_date}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      invoice_date: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Container Number
                </label>
                <input
                  value={shippingForm.container_number}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      container_number: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Vessel</label>
                <input
                  value={shippingForm.vessel}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      vessel: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Waybill Remark</label>
                <textarea
                  rows={3}
                  value={shippingForm.waybill_remark}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      waybill_remark: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Bill of Lading Remark
                </label>
                <textarea
                  rows={3}
                  value={shippingForm.bill_of_lading_remark}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      bill_of_lading_remark: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
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

