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

export default function ShippingDetailsPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const orderNumber = params.orderNumber;

  const [shippingForm, setShippingForm] = useState({
    invoice_number: "",
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

  const [shippingItems, setShippingItems] = useState<ShippingItemState[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [itemOptions, setItemOptions] = useState<
    { item_name: string; hscode: string; internal_code: string | null }[]
  >([]);
  const [itemQuery, setItemQuery] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;

    const fetchItems = async () => {
      try {
        const res = await fetch(ITEMS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        setItemOptions(
          data as { item_name: string; hscode: string; internal_code: string | null }[]
        );
      } catch {
        // ignore
      }
    };

    fetchItems();
  }, [orderNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber) return;

    if (!shippingForm.invoice_number.trim()) {
      showToast({
        title: "Invoice number required",
        description: "Please enter an invoice number before submitting.",
        variant: "error",
      });
      return;
    }
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
        description: "Please add at least one item to the shipping details.",
        variant: "error",
      });
      return;
    }

    const payload = {
      order_number: orderNumber,
      invoice_number: shippingForm.invoice_number.trim(),
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
      const res = await fetch(SHIPPING_INVOICES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const message =
          (data as any)?.detail || (data as any)?.message || "Please try again.";
        showToast({
          title: "Failed to save shipping details",
          description: message,
          variant: "error",
        });
        return;
      }

      showToast({
        title: "Shipping details saved",
        description: "The shipping details have been added successfully.",
        variant: "success",
      });

      router.push(`/diredawa/orders/${orderNumber}`);
    } catch {
      showToast({
        title: "Failed to save shipping details",
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
          Add Shipping Details
        </h1>
        <div className="w-[140px]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div>
              <label className="block font-medium mb-1">
                Order Number *
              </label>
              <input
                value={orderNumber}
                readOnly
                className="w-full border rounded-md px-3 py-2 bg-muted/40"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Invoice Number
              </label>
              <input
                value={shippingForm.invoice_number}
                onChange={(e) =>
                  setShippingForm((prev) => ({
                    ...prev,
                    invoice_number: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Waybill Number
              </label>
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
              <label className="block font-medium mb-1">
                Waybill Remark
              </label>
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

        <div className="border rounded-md p-4 space-y-4">
          <h2 className="font-semibold text-sm">Add Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="relative">
              <label className="block font-medium mb-1">Item name</label>
              <input
                value={shippingItem.item_name}
                onChange={(e) => {
                  const value = e.target.value;
                  setShippingItem((prev) => ({
                    ...prev,
                    item_name: value,
                  }));
                  setItemQuery(value);
                  setShowItemDropdown(true);
                }}
                onFocus={() => setShowItemDropdown(true)}
                autoComplete="off"
                className="w-full border rounded-md px-3 py-2"
              />
              {showItemDropdown && itemOptions.length > 0 && (
                <div
                  className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border shadow-lg"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  {itemOptions
                    .filter((opt) =>
                      opt.item_name
                        .toLowerCase()
                        .includes(itemQuery.toLowerCase())
                    )
                    .slice(0, 20)
                    .map((opt) => (
                      <button
                        type="button"
                        key={opt.internal_code ?? opt.item_name}
                        className="block w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                        style={{ backgroundColor: "#ffffff" }}
                        onClick={() => {
                          setShippingItem((prev) => ({
                            ...prev,
                            item_name: opt.item_name,
                          }));
                          setItemQuery(opt.item_name);
                          setShowItemDropdown(false);
                        }}
                      >
                        {opt.item_name}
                        {opt.hscode ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {opt.hscode}
                          </span>
                        ) : null}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1">Price</label>
              <input
                type="number"
                value={shippingItem.price}
                onChange={(e) =>
                  setShippingItem((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Quantity</label>
              <input
                type="number"
                value={shippingItem.quantity}
                onChange={(e) =>
                  setShippingItem((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value),
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Total Price</label>
              <input
                type="number"
                value={shippingItem.total_price}
                readOnly
                className="w-full border rounded-md px-3 py-2 bg-muted/40"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Measurement</label>
              <input
                value={shippingItem.measurement}
                onChange={(e) =>
                  setShippingItem((prev) => ({
                    ...prev,
                    measurement: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Bags</label>
              <input
                type="number"
                value={shippingItem.bags}
                onChange={(e) =>
                  setShippingItem((prev) => ({
                    ...prev,
                    bags: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Net weight</label>
              <input
                type="number"
                value={shippingItem.net_weight}
                onChange={(e) =>
                  setShippingItem((prev) => ({
                    ...prev,
                    net_weight: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Gross weight</label>
              <input
                type="number"
                value={shippingItem.gross_weight}
                onChange={(e) =>
                  setShippingItem((prev) => ({
                    ...prev,
                    gross_weight: e.target.value,
                  }))
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const total =
                  (Number(shippingItem.price) || 0) *
                  (Number(shippingItem.quantity) || 0);
                setShippingItem((prev) => ({
                  ...prev,
                  total_price: total,
                }));
              }}
            >
              Calculate Total
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (
                  !shippingItem.item_name ||
                  !shippingItem.quantity ||
                  !shippingItem.price
                ) {
                  showToast({
                    title: "Incomplete item",
                    description:
                      "Please fill Item name, Price and Quantity before adding.",
                    variant: "error",
                  });
                  return;
                }
                const total =
                  shippingItem.total_price ||
                  (Number(shippingItem.price) || 0) *
                    (Number(shippingItem.quantity) || 0);
                setShippingItems((prev) => [
                  ...prev,
                  { ...shippingItem, total_price: total },
                ]);
                setShippingItem({
                  item_name: "",
                  price: 0,
                  quantity: 0,
                  total_price: 0,
                  measurement: "",
                  bags: "",
                  net_weight: "",
                  gross_weight: "",
                });
              }}
            >
              Add Item
            </Button>
          </div>

          {shippingItems.length > 0 && (
            <div className="mt-3 border rounded-md overflow-hidden">
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
                  {shippingItems.map((it, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1">{it.item_name}</td>
                      <td className="px-2 py-1 text-right">{it.quantity}</td>
                      <td className="px-2 py-1 text-right">
                        {Number(it.price).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {Number(it.total_price).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}

