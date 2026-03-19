"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const CUSTOMERS_API_URL = "/api/partners/customers";
const SUPPLIERS_API_URL = "/api/partners/suppliers";
const ITEMS_API_URL = "/api/inventory/items";

interface OrderItemForm {
  item_name: string;
  hs_code: string;
  price: number | string;
  quantity: number | string;
  total_price: number;
  measurement: string;
}

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
  items?: { item_name: string; hs_code: string; price: number; quantity: number; total_price: number; measurement: string }[];
}

export default function EditOrderPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const orderNumber = params.orderNumber;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<{ name: string }[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ name: string }[]>([]);
  const [buyerQuery, setBuyerQuery] = useState("");
  const [shipperQuery, setShipperQuery] = useState("");
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const [showShipperDropdown, setShowShipperDropdown] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [isTotalCalculated, setIsTotalCalculated] = useState(false);
  const [currentItem, setCurrentItem] = useState<OrderItemForm>({
    item_name: "",
    hs_code: "",
    price: "",
    quantity: "",
    total_price: 0,
    measurement: "",
  });
  const [itemOptions, setItemOptions] = useState<
    { item_name: string; hscode: string; internal_code: string | null }[]
  >([]);
  const [itemQuery, setItemQuery] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
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
    const fetchCustomers = async () => {
      try {
        const res = await fetch(CUSTOMERS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        setCustomerOptions(data);
      } catch {
        // ignore
      }
    };
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(SUPPLIERS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        setSupplierOptions(data);
      } catch {
        // ignore
      }
    };
    const fetchItems = async () => {
      try {
        const res = await fetch(ITEMS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        setItemOptions(data);
      } catch {
        // ignore
      }
    };
    fetchCustomers();
    fetchSuppliers();
    fetchItems();
  }, []);

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
        setBuyerQuery(detail.buyer);
        setShipperQuery(detail.shipper);
        if (detail.items && detail.items.length > 0) {
          const items = detail.items.map((it) => ({
            item_name: it.item_name,
            hs_code: it.hs_code,
            price: String(it.price),
            quantity: String(it.quantity),
            total_price: it.total_price,
            measurement: it.measurement,
          }));
          setOrderItems(items);
          setItemsTotal(items.reduce((sum, it) => sum + (Number(it.total_price) || 0), 0));
          setIsTotalCalculated(true);
        } else {
          setOrderItems([]);
          setItemsTotal(0);
          setIsTotalCalculated(false);
        }
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

  const handleCalculateTotal = () => {
    const total = orderItems.reduce(
      (sum, it) => sum + (Number(it.total_price) || 0),
      0
    );
    setItemsTotal(total);
    setIsTotalCalculated(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber) return;

    if (!isTotalCalculated) {
      showToast({
        title: "Calculate total first",
        description: "Please click Calculate Total before saving.",
        variant: "error",
      });
      return;
    }

    if (orderItems.length === 0) {
      showToast({
        title: "No items",
        description: "Please add at least one item to the order.",
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
      port_of_loading: form.port_of_loading,
      port_of_discharge: form.port_of_discharge,
      measurement_type: form.measurement_type,
      payment_terms: form.payment_terms,
      mode_of_transport: form.mode_of_transport,
      freight: form.freight,
      freight_price:
        form.freight_price !== "" ? Number(form.freight_price) : null,
      shipment_type: form.shipment_type,
      items: orderItems.map((it) => ({
        item_name: it.item_name,
        hs_code: it.hs_code,
        price: Number(it.price) || 0,
        quantity: Math.floor(Number(it.quantity) || 0),
        total_price: Number(it.total_price) || 0,
        measurement: it.measurement,
      })),
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

  const handleBuyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, buyer: value }));
    setBuyerQuery(value);
    setShowBuyerDropdown(true);
  };

  const handleShipperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, shipper: value }));
    setShipperQuery(value);
    setShowShipperDropdown(true);
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
              <div className="relative">
                <label className="block font-medium mb-1">Buyer</label>
                <input
                  value={form.buyer}
                  onChange={handleBuyerChange}
                  className="w-full border rounded-md px-3 py-2"
                  autoComplete="off"
                  onFocus={() => setShowBuyerDropdown(true)}
                />
                {showBuyerDropdown && customerOptions.length > 0 && (
                  <div
                    className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border shadow-lg bg-white"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    {customerOptions
                      .filter((opt) =>
                        opt.name.toLowerCase().includes(buyerQuery.toLowerCase())
                      )
                      .slice(0, 20)
                      .map((opt) => (
                        <button
                          type="button"
                          key={opt.name}
                          className="block w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                          style={{ backgroundColor: "#ffffff" }}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, buyer: opt.name }));
                            setBuyerQuery(opt.name);
                            setShowBuyerDropdown(false);
                          }}
                        >
                          {opt.name}
                        </button>
                      ))}
                  </div>
                )}
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
              <div className="relative">
                <label className="block font-medium mb-1">Shipper</label>
                <input
                  value={form.shipper}
                  onChange={handleShipperChange}
                  className="w-full border rounded-md px-3 py-2"
                  autoComplete="off"
                  onFocus={() => setShowShipperDropdown(true)}
                />
                {showShipperDropdown && supplierOptions.length > 0 && (
                  <div
                    className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border shadow-lg bg-white"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    {supplierOptions
                      .filter((opt) =>
                        opt.name
                          .toLowerCase()
                          .includes(shipperQuery.toLowerCase())
                      )
                      .slice(0, 20)
                      .map((opt) => (
                        <button
                          type="button"
                          key={opt.name}
                          className="block w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                          style={{ backgroundColor: "#ffffff" }}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, shipper: opt.name }));
                            setShipperQuery(opt.name);
                            setShowShipperDropdown(false);
                          }}
                        >
                          {opt.name}
                        </button>
                      ))}
                  </div>
                )}
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

          {/* Items section */}
          <div className="border rounded-md p-4 space-y-4">
            <h2 className="font-semibold text-sm">Order Items</h2>

            {/* Add new item form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 border rounded-lg p-4">
              <div className="relative">
                <label className="block font-medium mb-1">Item name</label>
                <input
                  value={currentItem.item_name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCurrentItem((prev) => ({ ...prev, item_name: value }));
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
                            setCurrentItem((prev) => ({
                              ...prev,
                              item_name: opt.item_name,
                              hs_code: opt.hscode ?? "",
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
                <label className="block font-medium mb-1">HS CODE</label>
                <input
                  value={currentItem.hs_code}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({
                      ...prev,
                      hs_code: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Price</label>
                <input
                  type="number"
                  value={currentItem.price}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({
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
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({
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
                  value={currentItem.total_price}
                  readOnly
                  className="w-full border rounded-md px-3 py-2 bg-muted/40"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Measurement</label>
                <input
                  value={currentItem.measurement}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({
                      ...prev,
                      measurement: e.target.value,
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 bg-white"
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const priceNum = parseFloat(String(currentItem.price)) || 0;
                const qtyNum = parseFloat(String(currentItem.quantity)) || 0;
                if (
                  !currentItem.item_name ||
                  !String(currentItem.quantity).trim() ||
                  !String(currentItem.price).trim()
                ) {
                  showToast({
                    title: "Incomplete item",
                    description:
                      "Please fill Item name, Price and Quantity before adding.",
                    variant: "error",
                  });
                  return;
                }
                if (priceNum <= 0 || qtyNum <= 0) {
                  showToast({
                    title: "Invalid values",
                    description: "Price and Quantity must be greater than 0.",
                    variant: "error",
                  });
                  return;
                }
                const total = priceNum * qtyNum;
                setOrderItems((prev) => [
                  ...prev,
                  {
                    ...currentItem,
                    price: priceNum,
                    quantity: qtyNum,
                    total_price: total,
                  },
                ]);
                setIsTotalCalculated(false);
                setCurrentItem({
                  item_name: "",
                  hs_code: "",
                  price: "",
                  quantity: "",
                  total_price: 0,
                  measurement: "",
                });
              }}
            >
              Add Item
            </Button>

            {/* Editable items */}
            {orderItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {orderItems.map((it, idx) => (
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
                        setOrderItems((prev) =>
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
                            setOrderItems((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], item_name: value };
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
                                    setOrderItems((prev) => {
                                      const next = [...prev];
                                      next[idx] = {
                                        ...next[idx],
                                        item_name: opt.item_name,
                                        hs_code: opt.hscode ?? "",
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
                        <label className="block font-medium mb-1">HS CODE</label>
                        <input
                          value={it.hs_code}
                          onChange={(e) =>
                            setOrderItems((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], hs_code: e.target.value };
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
                            setOrderItems((prev) => {
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
                            setOrderItems((prev) => {
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
                            setOrderItems((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], measurement: e.target.value };
                              return next;
                            })
                          }
                          className="w-full border rounded-md px-3 py-2 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 mt-6 -mx-6 -mb-6 px-6 py-5 bg-black rounded-b-md">
            <span className="text-white text-lg font-semibold">
              Total Price: $
              {itemsTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <div className="flex items-center gap-4">
            <Button
              type="button"
              size="lg"
              onClick={handleCalculateTotal}
              variant="cta"
              className="animate-pulse"
            >
              Calculate Total
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => router.push(`/diredawa/orders/${orderNumber}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !isTotalCalculated ||
                orderItems.length === 0 ||
                orderItems.some((it) => !(Number(it.total_price) > 0))
              }
              className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

