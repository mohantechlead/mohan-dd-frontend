 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type MeasurementType =
  | "Metric Tons"
  | "KGs"
  | "Meters"
  | "Ltr"
  | "PCs"
  | "Spools"
  | "Sets"
  | "Other";

type PaymentTerms =
  | "Irrevocable LC at Sight"
  | "Cash Against Doc"
  | "Telegraphic Transfer"
  | "Confirmed LC"
  | "Deferred LC"
  | "Franco Valuta"
  | "Open Credit"
  | "TT(Open Credit)";

type ModeOfTransport = "Sea" | "Air" | "Truck" | "Train";

type Freight = "Payable at Destination" | "Pre-paid";

type ShipmentType = "FOB" | "CFR" | "FCA" | "CIF" | "Air Freight";

interface OrderItem {
  item_name: string;
  hs_code: string;
  price: number;
  quantity: number;
  total_price: number;
  measurement: string;
}

/** Form state for current item - price/quantity as string so inputs can be cleared */
interface OrderItemForm {
  item_name: string;
  hs_code: string;
  price: string;
  quantity: string;
  total_price: number;
  measurement: string;
}

interface OrderFormState {
  order_number: string;
  proforma_ref_no: string;
  buyer: string;
  add_consignee: string;
  order_date: string;
  shipper: string;
  notify_party: string;
  add_notify_party: string;
  country_of_origin: string;
  final_destination: string;
  port_of_loading: string;
  port_of_discharge: string;
  measurement_type: MeasurementType | "";
  payment_terms: PaymentTerms | "";
  mode_of_transport: ModeOfTransport | "";
  freight: Freight | "";
  freight_price: string;
  shipment_type: ShipmentType | "";
}

const ORDER_API_URL = "/api/orders";
const ITEMS_API_URL = "/api/inventory/items";
const CUSTOMERS_API_URL = "/api/partners/customers";
const SUPPLIERS_API_URL = "/api/partners/suppliers";

export default function CreateOrderPage() {
  const { showToast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState<OrderFormState>({
    order_number: "",
    proforma_ref_no: "",
    buyer: "",
    add_consignee: "",
    order_date: "",
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

  const [currentItem, setCurrentItem] = useState<OrderItemForm>({
    item_name: "",
    hs_code: "",
    price: "",
    quantity: "",
    total_price: 0,
    measurement: "",
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemOptions, setItemOptions] = useState<
    { item_name: string; hscode: string; internal_code: string | null }[]
  >([]);
  const [itemQuery, setItemQuery] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  const [customerOptions, setCustomerOptions] = useState<
    { name: string }[]
  >([]);
  const [buyerQuery, setBuyerQuery] = useState("");
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);

  const [supplierOptions, setSupplierOptions] = useState<
    { name: string }[]
  >([]);
  const [shipperQuery, setShipperQuery] = useState("");
  const [showShipperDropdown, setShowShipperDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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
        // ignore for now
      }
    };
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

    fetchItems();
    fetchCustomers();
    fetchSuppliers();
  }, []);

  const handleHeaderChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "buyer") {
      setBuyerQuery(value);
      setShowBuyerDropdown(true);
    }
    if (name === "shipper") {
      setShipperQuery(value);
      setShowShipperDropdown(true);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: keyof OrderFormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "item_name") {
      setItemQuery(value);
      setShowItemDropdown(true);
    }
    setCurrentItem((prev) => {
      const next: OrderItemForm = {
        ...prev,
        [name]:
          name === "price" || name === "quantity"
            ? value
            : name === "total_price"
              ? Number(value)
              : value,
      } as OrderItemForm;
      // Auto-calculate Total Price when price or quantity changes
      if (name === "price" || name === "quantity") {
        const priceNum = parseFloat(String(next.price)) || 0;
        const qty = parseFloat(String(next.quantity)) || 0;
        next.total_price = priceNum * qty;
      }
      return next;
    });
  };

  const handleCalculateTotal = () => {
    const total = items.reduce((sum, it) => sum + it.total_price, 0);
    setItemsTotal(total);
  };

  const handleAddItem = () => {
    const priceNum = parseFloat(String(currentItem.price));
    const qtyNum = parseFloat(String(currentItem.quantity));
    if (!currentItem.item_name || !currentItem.quantity || !currentItem.price || Number.isNaN(priceNum) || Number.isNaN(qtyNum)) {
      showToast({
        title: "Incomplete item",
        description: "Please fill Item name, Price and Quantity before adding.",
        variant: "error",
      });
      return;
    }

    const priceVal = priceNum || 0;
    const qtyVal = qtyNum || 0;
    const total =
      currentItem.total_price || priceVal * qtyVal;

    const itemToAdd: OrderItem = {
      ...currentItem,
      price: priceVal,
      quantity: qtyVal,
      total_price: total,
    };

    setItems((prev) => [...prev, itemToAdd]);
    setCurrentItem({
      item_name: "",
      hs_code: "",
      price: "",
      quantity: "",
      total_price: 0,
      measurement: "",
    });
  };

  const handleOrderNumberBlur = async () => {
    const value = form.order_number.trim();
    if (!value) return;

    try {
      const res = await fetch(ORDER_API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return;
      const data = await res.json();
      const duplicate = (data as any[]).some(
        (o) => (o as any).order_number === value
      );
      if (duplicate) {
        showToast({
          title: "Duplicate order number",
          description: "Order number already exists.",
          variant: "error",
        });
      }
    } catch {
      // ignore blur error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate order number before submitting
    try {
      const existingRes = await fetch(ORDER_API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (existingRes.ok) {
        const existingData = await existingRes.json();
        const duplicate = (existingData as any[]).some(
          (o) => (o as any).order_number === form.order_number
        );
        if (duplicate) {
          showToast({
            title: "Duplicate order number",
            description: "Order number already exists.",
            variant: "error",
          });
          return;
        }
      }
    } catch {
      // If the duplicate check fails, continue to submit and rely on backend
    }

    if (items.length === 0) {
      showToast({
        title: "No items added",
        description: "Please add at least one item to the order.",
        variant: "error",
      });
      return;
    }

    const freightPriceVal = form.freight_price?.trim();
    const payload = {
      ...form,
      order_date: form.order_date,
      freight_price: freightPriceVal && !Number.isNaN(parseFloat(freightPriceVal))
        ? parseFloat(freightPriceVal)
        : null,
      items,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(ORDER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          title: "Failed to create order",
          description:
            (data as any)?.detail ||
            (data as any)?.message ||
            "Please check the form and try again.",
          variant: "error",
        });
        return;
      }

      showToast({
        title: "Order created",
        description: "The order has been created successfully.",
        variant: "success",
      });

      router.push("/diredawa/orders/display");
    } catch (error) {
      showToast({
        title: "Failed to create order",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-4">
      <div className="flex justify-start mb-8">
        <Button onClick={() => router.push("/diredawa/orders/display")}>
          Display Sales
        </Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6 relative">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium">Creating order...</p>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-center">Create Order</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Order Number *
              </label>
              <input
                name="order_number"
                value={form.order_number}
                onChange={handleHeaderChange}
                onBlur={handleOrderNumberBlur}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Proforma Ref. No *
              </label>
              <input
                name="proforma_ref_no"
                value={form.proforma_ref_no}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Buyer *</label>
              <input
                name="buyer"
                value={form.buyer}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
                required
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
              <label className="block text-sm font-medium mb-1">
                Add Consignee
              </label>
              <input
                name="add_consignee"
                value={form.add_consignee}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Country of Origin*
              </label>
              <input
                name="country_of_origin"
                value={form.country_of_origin}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Final Destination*
              </label>
              <input
                name="final_destination"
                value={form.final_destination}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Order Date *
              </label>
              <input
                type="date"
                name="order_date"
                value={form.order_date}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">
                Shipper*
              </label>
              <input
                name="shipper"
                value={form.shipper}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
                required
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Notify Party
              </label>
              <input
                name="notify_party"
                value={form.notify_party}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Add Notify Party
              </label>
              <input
                name="add_notify_party"
                value={form.add_notify_party}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Port of Loading*
              </label>
              <input
                name="port_of_loading"
                value={form.port_of_loading}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Port of Discharge*
              </label>
              <input
                name="port_of_discharge"
                value={form.port_of_discharge}
                onChange={handleHeaderChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
          </div>
          </div>

          {/* Radio groups */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="font-semibold text-sm">Measurement Type</p>
              <div className="space-y-1 text-sm">
              {[
                "Metric Tons",
                "KGs",
                "Meters",
                "Ltr",
                "PCs",
                "Spools",
                "Sets",
                "Other",
              ].map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white cursor-pointer"
                >
                  <input
                    type="radio"
                    name="measurement_type"
                    value={label}
                    checked={form.measurement_type === label}
                    onChange={() =>
                      handleRadioChange("measurement_type", label)
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="font-semibold text-sm">Payment Terms</p>
              <div className="space-y-1 text-sm">
              {[
                "Irrevocable LC at Sight",
                "Cash Against Doc",
                "Telegraphic Transfer",
                "Confirmed LC",
                "Deferred LC",
                "Franco Valuta",
                "Open Credit",
                "TT(Open Credit)",
              ].map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white cursor-pointer"
                >
                  <input
                    type="radio"
                    name="payment_terms"
                    value={label}
                    checked={form.payment_terms === label}
                    onChange={() => handleRadioChange("payment_terms", label)}
                  />
                  <span>{label}</span>
                </label>
              ))}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="font-semibold text-sm mb-2">Mode of Transport</p>
                <div className="space-y-1 text-sm">
                {["Sea", "Air", "Truck", "Train"].map((label) => (
                  <label
                    key={label}
                    className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="mode_of_transport"
                      value={label}
                      checked={form.mode_of_transport === label}
                      onChange={() =>
                        handleRadioChange("mode_of_transport", label)
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Freight</p>
                <div className="space-y-1 text-sm">
                {["Payable at Destination", "Pre-paid"].map((label) => (
                  <label
                    key={label}
                    className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="freight"
                      value={label}
                      checked={form.freight === label}
                      onChange={() => handleRadioChange("freight", label)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Freight Price
                </label>
                <input
                  name="freight_price"
                  type="number"
                  step="0.01"
                  value={form.freight_price}
                  onChange={handleHeaderChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Shipment Type</p>
                <div className="space-y-1 text-sm">
                {["FOB", "CFR", "FCA", "CIF", "Air Freight"].map((label) => (
                  <label
                    key={label}
                    className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="shipment_type"
                      value={label}
                      checked={form.shipment_type === label}
                      onChange={() =>
                        handleRadioChange("shipment_type", label)
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
                </div>
              </div>
            </div>
          </div>

          {/* Item section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Items</h2>
              {items.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {items.length} item{items.length > 1 ? "s" : ""} added
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 border rounded-lg p-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-1">
                Item name
              </label>
              <input
                name="item_name"
                value={currentItem.item_name}
                onChange={handleItemChange}
                onFocus={() => setShowItemDropdown(true)}
                className="w-full border rounded-md px-3 py-2"
                autoComplete="off"
              />
              {showItemDropdown && itemOptions.length > 0 && (
                <div
                  className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border shadow-lg bg-white"
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
                          setCurrentItem((prev) => ({
                            ...prev,
                            item_name: opt.item_name,
                            hs_code: opt.hscode,
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
              <label className="block text-sm font-medium mb-1">
                HS CODE
              </label>
              <input
                name="hs_code"
                value={currentItem.hs_code}
                onChange={handleItemChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                name="price"
                value={currentItem.price}
                onChange={handleItemChange}
                className="w-full border rounded-md px-3 py-2"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={currentItem.quantity}
                onChange={handleItemChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Total Price
              </label>
              <input
                type="number"
                name="total_price"
                value={currentItem.total_price}
                readOnly
                className="w-full border rounded-md px-3 py-2 bg-muted/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Measurement
              </label>
              <input
                name="measurement"
                value={currentItem.measurement}
                onChange={handleItemChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
                <span className="ml-auto text-sm font-semibold">
                  Total Price: ${itemsTotal.toFixed(2)}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCalculateTotal}
              >
                Calculate Total
              </Button>
            </div>

            {items.length > 0 && (
              <div className="mt-4 border rounded-md overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="text-left px-3 py-2">Item</th>
                      <th className="text-left px-3 py-2">HS CODE</th>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Price</th>
                      <th className="text-right px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{it.item_name}</td>
                        <td className="px-3 py-2">{it.hs_code}</td>
                        <td className="px-3 py-2 text-right">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          {it.price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {it.total_price.toLocaleString(undefined, {
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

          <div className="flex justify-end">
            <Button
              type="submit"
              className="px-10"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

