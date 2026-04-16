"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const SHIPPING_INVOICES_API_URL = "/api/inventory/shipping-invoices";
const ITEMS_API_URL = "/api/inventory/items";

interface ShippingItemState {
  item_id: string;
  item_name: string;
  hscode: string;
  price: number | string;
  quantity: number | string;
  total_price: number;
  measurement: string;
  bags: string;
  net_weight: string;
  gross_weight: string;
  grade: string;
  brand: string;
  country_of_origin: string;
}

interface ShippingInvoiceDetail {
  id: string;
  order_number: string;
  invoice_number: string;
  invoice_date: string;
  waybill_number?: string | null;
  ecd_no?: string | null;
  customer_order_number: string;
  container_number?: string | null;
  vessel?: string | null;
  freight_amount?: number | null;
  reference_no?: string | null;
  total_bags?: number | null;
  total_net_weight?: number | null;
  total_gross_weight?: number | null;
  final_price?: number | null;
  invoice_remark?: string | null;
  packing_list_remark?: string | null;
  waybill_remark?: string | null;
  bill_of_lading_remark?: string | null;
  bank?: string | null;
  sr_no?: number;
  items: {
    item_id?: string | null;
    item_name: string;
    hscode?: string | null;
    price: number;
    quantity: number;
    total_price: number;
    measurement: string;
    bags?: number | null;
    net_weight?: number | null;
    gross_weight?: number | null;
    grade?: string | null;
    brand?: string | null;
    country_of_origin?: string | null;
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
    ecd_no: "",
    customer_order_number: "",
    container_number: "",
    vessel: "",
    freight_amount: "",
    reference_no: "",
    total_bags: "",
    total_net_weight: "",
    total_gross_weight: "",
    final_price: "",
    invoice_remark: "",
    packing_list_remark: "",
    waybill_remark: "",
    bill_of_lading_remark: "",
    bank: "",
    sr_no: "",
  });

  const [shippingItems, setShippingItems] = useState<ShippingItemState[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [isTotalCalculated, setIsTotalCalculated] = useState(false);
  const [shippingItem, setShippingItem] = useState<ShippingItemState>({
    item_id: "",
    item_name: "",
    hscode: "",
    price: "",
    quantity: "",
    total_price: 0,
    measurement: "",
    bags: "",
    net_weight: "",
    gross_weight: "",
    grade: "",
    brand: "",
    country_of_origin: "",
  });

  const [itemOptions, setItemOptions] = useState<
    { item_id?: string; item_name: string; hscode: string; internal_code: string | null }[]
  >([]);
  const [itemQuery, setItemQuery] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

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
            ecd_no: invData.ecd_no || "",
            customer_order_number: invData.customer_order_number,
            container_number: invData.container_number || "",
            vessel: invData.vessel || "",
            freight_amount:
              invData.freight_amount != null ? String(invData.freight_amount) : "",
            reference_no: invData.reference_no || "",
            total_bags: invData.total_bags != null ? String(invData.total_bags) : "",
            total_net_weight:
              invData.total_net_weight != null
                ? String(invData.total_net_weight)
                : "",
            total_gross_weight:
              invData.total_gross_weight != null
                ? String(invData.total_gross_weight)
                : "",
            final_price: invData.final_price != null ? String(invData.final_price) : "",
            invoice_remark: invData.invoice_remark || "",
            packing_list_remark: invData.packing_list_remark || "",
            waybill_remark: invData.waybill_remark || "",
            bill_of_lading_remark: invData.bill_of_lading_remark || "",
            bank: invData.bank || "",
            sr_no: invData.sr_no != null ? String(invData.sr_no) : "",
          });
          const items = invData.items.map((it) => ({
            item_id: it.item_id ?? "",
            item_name: it.item_name,
            hscode: it.hscode ?? "",
            price: String(it.price),
            quantity: String(it.quantity),
            total_price: it.total_price,
            measurement: it.measurement,
            bags: it.bags != null ? String(it.bags) : "",
            net_weight: it.net_weight != null ? String(it.net_weight) : "",
            gross_weight:
              it.gross_weight != null ? String(it.gross_weight) : "",
            grade: it.grade ?? "",
            brand: it.brand ?? "",
            country_of_origin: it.country_of_origin ?? "",
          }));
          setShippingItems(items);
          setItemsTotal(
            items.reduce((sum, it) => sum + (Number(it.total_price) || 0), 0)
          );
          setIsTotalCalculated(true);
        }

        if (itemsRes.ok) {
          const itemsData =
            (await itemsRes.json()) as {
              item_id?: string;
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

  const handleCalculateTotal = () => {
    const total = shippingItems.reduce(
      (sum, it) => sum + (Number(it.total_price) || 0),
      0
    );
    setItemsTotal(total);
    setIsTotalCalculated(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !invoiceId) return;

    if (!isTotalCalculated) {
      showToast({
        title: "Calculate total first",
        description: "Please click Calculate Total before saving.",
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
        description: "Please add at least one item.",
        variant: "error",
      });
      return;
    }

    const payload = {
      invoice_date: shippingForm.invoice_date,
      waybill_number: shippingForm.waybill_number || null,
      ecd_no: shippingForm.ecd_no.trim() || null,
      customer_order_number: shippingForm.customer_order_number.trim(),
      container_number: shippingForm.container_number || null,
      vessel: shippingForm.vessel || null,
      freight_amount:
        shippingForm.freight_amount.trim() !== ""
          ? Number(shippingForm.freight_amount)
          : null,
      reference_no: shippingForm.reference_no.trim() || null,
      total_bags:
        shippingForm.total_bags.trim() !== ""
          ? Number(shippingForm.total_bags)
          : null,
      total_net_weight:
        shippingForm.total_net_weight.trim() !== ""
          ? Number(shippingForm.total_net_weight)
          : null,
      total_gross_weight:
        shippingForm.total_gross_weight.trim() !== ""
          ? Number(shippingForm.total_gross_weight)
          : null,
      final_price:
        shippingForm.final_price.trim() !== ""
          ? Number(shippingForm.final_price)
          : null,
      invoice_remark: shippingForm.invoice_remark || null,
      packing_list_remark: shippingForm.packing_list_remark || null,
      waybill_remark: shippingForm.waybill_remark || null,
      bill_of_lading_remark: shippingForm.bill_of_lading_remark || null,
      bank: shippingForm.bank.trim() || null,
      sr_no: shippingForm.sr_no !== "" ? Number(shippingForm.sr_no) : null,
      items: shippingItems.map((it) => ({
        item_id: it.item_id || null,
        item_name: it.item_name,
        hscode: it.hscode?.trim() || null,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 0,
        total_price: Number(it.total_price) || 0,
        measurement: it.measurement,
        bags: it.bags ? Number(it.bags) : null,
        net_weight: it.net_weight ? Number(it.net_weight) : null,
        gross_weight: it.gross_weight ? Number(it.gross_weight) : null,
        grade: it.grade?.trim() || null,
        brand: it.brand?.trim() || null,
        country_of_origin: it.country_of_origin?.trim() || null,
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
                <label className="block font-medium mb-1">Sr. No. (optional)</label>
                <input
                  type="number"
                  min={1}
                  value={shippingForm.sr_no}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      sr_no: e.target.value,
                    }))
                  }
                  placeholder="Leave empty for no Sr. No."
                  className="w-full border rounded-md px-3 py-2"
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
                <label className="block font-medium mb-1">ECD No</label>
                <input
                  value={shippingForm.ecd_no}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      ecd_no: e.target.value,
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
                <label className="block font-medium mb-1">Reference No</label>
                <input
                  value={shippingForm.reference_no}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      reference_no: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Freight Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={shippingForm.freight_amount}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      freight_amount: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Final Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={shippingForm.final_price}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      final_price: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Total Bags</label>
                <input
                  type="number"
                  value={shippingForm.total_bags}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      total_bags: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Total Net Weight</label>
                <input
                  type="number"
                  value={shippingForm.total_net_weight}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      total_net_weight: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Total Gross Weight</label>
                <input
                  type="number"
                  value={shippingForm.total_gross_weight}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      total_gross_weight: e.target.value,
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
              <div>
                <label className="block font-medium mb-1">Bank</label>
                <textarea
                  rows={3}
                  placeholder="Beneficiary bank name, SWIFT, account no., etc."
                  value={shippingForm.bank}
                  onChange={(e) =>
                    setShippingForm((prev) => ({
                      ...prev,
                      bank: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Items section - card format like create */}
          <div className="border rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Invoice Items</h2>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (
                      !shippingItem.item_name ||
                      !String(shippingItem.quantity).trim() ||
                      !String(shippingItem.price).trim()
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
                    setIsTotalCalculated(false);
                    setShippingItem({
                      item_id: "",
                      item_name: "",
                      hscode: "",
                      price: "",
                      quantity: "",
                      total_price: 0,
                      measurement: "",
                      bags: "",
                      net_weight: "",
                      gross_weight: "",
                      grade: "",
                      brand: "",
                      country_of_origin: "",
                    });
                    setItemQuery("");
                  }}
                >
                  Add Item
                </Button>
                <span className="ml-auto text-sm font-semibold">
                  Total Price: $
                  {itemsTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="cta"
              size="lg"
              className="w-full animate-pulse"
              onClick={handleCalculateTotal}
            >
              Calculate Total
            </Button>

            {/* Add new item form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 border rounded-lg p-4">
              <div className="relative">
                <label className="block font-medium mb-1">Item name</label>
                <input
                  value={shippingItem.item_name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setShippingItem((prev) => ({
                      ...prev,
                      item_id: "",
                      item_name: value,
                    }));
                    setItemQuery(value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  onBlur={() => setTimeout(() => setShowItemDropdown(false), 150)}
                  autoComplete="off"
                  className="w-full border rounded-md px-3 py-2 bg-white"
                />
                {showItemDropdown && itemOptions.length > 0 && (
                  <div
                    className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border shadow-lg bg-white"
                    style={{ backgroundColor: "#ffffff" }}
                    onMouseDown={(e) => e.preventDefault()}
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
                          className="block w-full text-left px-3 py-1.5 text-sm bg-white hover:bg-gray-100"
                          onClick={() => {
                            setShippingItem((prev) => ({
                              ...prev,
                              item_id: opt.item_id ?? "",
                              item_name: opt.item_name,
                              hscode: opt.hscode ?? "",
                              grade: opt.internal_code ?? "",
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
                <label className="block font-medium mb-1">HS Code</label>
                <input
                  value={shippingItem.hscode}
                  onChange={(e) =>
                    setShippingItem((prev) => ({
                      ...prev,
                      hscode: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Price</label>
                <input
                  type="number"
                  value={shippingItem.price}
                  onChange={(e) =>
                    setShippingItem((prev) => ({
                      ...prev,
                      price: e.target.value,
                      total_price:
                        (Number(e.target.value) || 0) *
                        (Number(prev.quantity) || 0),
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 bg-white"
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
                      quantity: e.target.value,
                      total_price:
                        (Number(prev.price) || 0) *
                        (Number(e.target.value) || 0),
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 bg-white"
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
                  className="w-full border rounded-md px-3 py-2 bg-white"
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
                  className="w-full border rounded-md px-3 py-2 bg-white"
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
                  className="w-full border rounded-md px-3 py-2 bg-white"
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
                  className="w-full border rounded-md px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Grade</label>
                <input
                  value={shippingItem.grade}
                  onChange={(e) =>
                    setShippingItem((prev) => ({
                      ...prev,
                      grade: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 bg-white"
                  placeholder="Auto-filled from item internal code"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Brand</label>
                <input
                  value={shippingItem.brand}
                  onChange={(e) =>
                    setShippingItem((prev) => ({
                      ...prev,
                      brand: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Country of Origin</label>
                <input
                  value={shippingItem.country_of_origin}
                  onChange={(e) =>
                    setShippingItem((prev) => ({
                      ...prev,
                      country_of_origin: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 bg-white"
                  placeholder="e.g. CHINA"
                />
              </div>
            </div>

            {/* Editable items in card format - 2 column grid */}
            {shippingItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {shippingItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 bg-white relative"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setShippingItems((prev) =>
                          prev.filter((_, i) => i !== idx)
                        );
                        setOpenDropdownIndex(null);
                      }}
                    >
                      Remove
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative pr-20">
                      <label className="block font-medium mb-1">Item name</label>
                      <input
                        value={it.item_name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], item_name: value, item_id: "" };
                            return next;
                          });
                          setItemQuery(value);
                          setOpenDropdownIndex(idx);
                        }}
                        onFocus={() => {
                          setItemQuery(it.item_name);
                          setOpenDropdownIndex(idx);
                        }}
                        onBlur={() =>
                          setTimeout(() => setOpenDropdownIndex(null), 150)
                        }
                        autoComplete="off"
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                      {openDropdownIndex === idx && itemOptions.length > 0 && (
                        <div
                          className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border shadow-lg bg-white"
                          style={{ backgroundColor: "#ffffff" }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {itemOptions
                            .filter((opt) =>
                              opt.item_name
                                .toLowerCase()
                                .includes(it.item_name.toLowerCase())
                            )
                            .slice(0, 20)
                            .map((opt) => (
                              <button
                                type="button"
                                key={opt.internal_code ?? opt.item_name}
                                className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 bg-white"
                                onClick={() => {
                                  setShippingItems((prev) => {
                                    const next = [...prev];
                                    next[idx] = {
                                      ...next[idx],
                                        item_id: opt.item_id ?? "",
                                      item_name: opt.item_name,
                                        hscode: opt.hscode ?? "",
                                      grade: opt.internal_code ?? "",
                                    };
                                    return next;
                                  });
                                  setItemQuery("");
                                  setOpenDropdownIndex(null);
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
                      <label className="block font-medium mb-1">HS Code</label>
                      <input
                        value={it.hscode}
                        onChange={(e) =>
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], hscode: e.target.value };
                            return next;
                          })
                        }
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Price</label>
                      <input
                        type="number"
                        value={it.price}
                        onChange={(e) => {
                          const priceStr = e.target.value;
                          const price = Number(priceStr) || 0;
                          const qty = Number(it.quantity) || 0;
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = {
                              ...next[idx],
                              price: priceStr,
                              total_price: qty * price,
                            };
                            return next;
                          });
                        }}
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Quantity</label>
                      <input
                        type="number"
                        value={it.quantity}
                        onChange={(e) => {
                          const qtyStr = e.target.value;
                          const qty = Number(qtyStr) || 0;
                          const price = Number(it.price) || 0;
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = {
                              ...next[idx],
                              quantity: qtyStr,
                              total_price: qty * price,
                            };
                            return next;
                          });
                        }}
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Total Price</label>
                      <input
                        type="number"
                        value={it.total_price}
                        readOnly
                        className="w-full border rounded-md px-3 py-2 bg-muted/40"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Measurement</label>
                      <input
                        value={it.measurement}
                        onChange={(e) =>
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], measurement: e.target.value };
                            return next;
                          })
                        }
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Bags</label>
                      <input
                        type="number"
                        value={it.bags}
                        onChange={(e) =>
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], bags: e.target.value };
                            return next;
                          })
                        }
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Net weight</label>
                      <input
                        type="number"
                        value={it.net_weight}
                        onChange={(e) =>
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], net_weight: e.target.value };
                            return next;
                          })
                        }
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Gross weight</label>
                      <input
                        type="number"
                        value={it.gross_weight}
                        onChange={(e) =>
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], gross_weight: e.target.value };
                            return next;
                          })
                        }
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Grade</label>
                      <input
                        value={it.grade}
                        onChange={(e) =>
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], grade: e.target.value };
                            return next;
                          })
                        }
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Brand</label>
                      <input
                        value={it.brand}
                        onChange={(e) =>
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], brand: e.target.value };
                            return next;
                          })
                        }
                        className="w-full border rounded-md px-3 py-2 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Country of Origin</label>
                      <input
                        value={it.country_of_origin}
                        onChange={(e) =>
                          setShippingItems((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], country_of_origin: e.target.value };
                            return next;
                          })
                        }
                        className="w-full border rounded-md px-3 py-2 bg-white"
                        placeholder="e.g. CHINA"
                      />
                    </div>
                    </div>
                  </div>
                ))}
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
            <Button type="submit" disabled={submitting || !isTotalCalculated}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

