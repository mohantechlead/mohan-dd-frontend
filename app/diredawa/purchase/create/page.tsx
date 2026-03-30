 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  parseInventoryItemsJson,
  type InventoryItemOption,
} from "@/lib/parseInventoryItems";

type MeasurementType =
  | "Metric Tons"
  | "KGs"
  | "Meters"
  | "Ltr"
  | "PCs"
  | "Spools"
  | "Sets"
  | "Other";

type PaymentType =
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

interface PurchaseItem {
  item_id?: string | null;
  /** Mirrors header purchase number for each line (server stores on item). */
  purchase_number?: string;
  item_name: string;
  hscode?: string;
  price: number;
  quantity: number;
  /** Defaults to quantity until receipts reduce it */
  remaining?: number;
  total_price: number;
  /** Line before VAT; same as total_price unless adjusted later */
  before_vat?: number;
  measurement: string;
}

/** Form state for current item - price/quantity as string so inputs can be cleared */
interface PurchaseItemForm {
  item_id: string;
  item_name: string;
  hscode: string;
  price: string;
  quantity: string;
  total_price: number;
  measurement: string;
}

interface PurchaseFormState {
  purchase_number: string;
  proforma_ref_no: string;
  buyer: string;
  add_consignee: string;
  order_date: string;
  shipper: string;
  notify_party: string;
  add_notify_party: string;
  country_of_origin: string;
  final_destination: string;
  conditions: string;
  port_of_loading: string;
  port_of_discharge: string;
  measurement_type: MeasurementType | "";
  payment_type: PaymentType | "";
  mode_of_transport: ModeOfTransport | "";
  freight: Freight | "";
  freight_price: string;
  insurance: string;
  shipment_type: ShipmentType | "";
}

const PURCHASE_API_URL = "/api/purchases";
const PURCHASE_NEXT_NUMBER_URL = "/api/purchases/next-number";
const ITEMS_API_URL = "/api/inventory/items";
const CUSTOMERS_API_URL = "/api/partners/customers";
const SUPPLIERS_API_URL = "/api/partners/suppliers";

export default function CreatePurchasePage() {
  const { showToast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState<PurchaseFormState>({
    purchase_number: "",
    proforma_ref_no: "",
    buyer: "",
    add_consignee: "",
    order_date: "",
    shipper: "",
    notify_party: "",
    add_notify_party: "",
    country_of_origin: "",
    final_destination: "",
    conditions: "",
    port_of_loading: "",
    port_of_discharge: "",
    measurement_type: "",
    payment_type: "",
    mode_of_transport: "",
    freight: "",
    freight_price: "",
    insurance: "",
    shipment_type: "",
  });

  const [currentItem, setCurrentItem] = useState<PurchaseItemForm>({
    item_id: "",
    item_name: "",
    hscode: "",
    price: "",
    quantity: "",
    total_price: 0,
    measurement: "",
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [isTotalCalculated, setIsTotalCalculated] = useState(false);
  const [itemOptions, setItemOptions] = useState<InventoryItemOption[]>([]);
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
  const [purchaseNumberEditable, setPurchaseNumberEditable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(PURCHASE_NEXT_NUMBER_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const next =
          typeof data?.next_number === "string"
            ? data.next_number
            : typeof data?.next === "string"
              ? data.next
              : "";
        if (next && !cancelled) {
          setForm((prev) => ({ ...prev, purchase_number: next }));
        }
      } catch {
        // leave empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(ITEMS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          showToast({
            title: "Could not load items",
            description:
              typeof data?.message === "string"
                ? data.message
                : `Request failed (${res.status})`,
            variant: "error",
          });
          setItemOptions([]);
          return;
        }
        setItemOptions(parseInventoryItemsJson(data));
      } catch {
        showToast({
          title: "Could not load items",
          description: "Network error. Is the app reachable?",
          variant: "error",
        });
        setItemOptions([]);
      }
    };
    const fetchCustomers = async () => {
      try {
        const res = await fetch(CUSTOMERS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setCustomerOptions(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    };
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(SUPPLIERS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setSupplierOptions(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    };

    fetchItems();
    fetchCustomers();
    fetchSuppliers();
  }, [showToast]);

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

  const handleRadioChange = (name: keyof PurchaseFormState, value: string) => {
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
      const next: PurchaseItemForm = {
        ...prev,
        [name]:
          name === "price" || name === "quantity"
            ? value
            : name === "total_price"
              ? Number(value)
              : value,
      } as PurchaseItemForm;
      if (name === "item_name") {
        next.item_id = "";
      }
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
    setIsTotalCalculated(true);
  };

  const handleAddItem = () => {
    const priceNum = parseFloat(String(currentItem.price));
    const qtyNum = parseFloat(String(currentItem.quantity));
    if (!currentItem.item_name || !currentItem.quantity || !currentItem.price || Number.isNaN(priceNum) || Number.isNaN(qtyNum)) {
      showToast({
        title: "Incomplete item",
        description:
          "Please fill Item name, Price and Quantity before adding.",
        variant: "error",
      });
      return;
    }

    const priceVal = priceNum || 0;
    const qtyVal = qtyNum || 0;
    const total =
      currentItem.total_price || priceVal * qtyVal;

    const itemToAdd: PurchaseItem = {
      ...currentItem,
      item_id: currentItem.item_id.trim() || undefined,
      purchase_number: form.purchase_number.trim() || undefined,
      hscode: currentItem.hscode.trim() || undefined,
      price: priceVal,
      quantity: qtyVal,
      remaining: qtyVal,
      total_price: total,
      before_vat: total,
    };

    setItems((prev) => [...prev, itemToAdd]);
    setIsTotalCalculated(false);
    setCurrentItem({
      item_id: "",
      item_name: "",
      hscode: "",
      price: "",
      quantity: "",
      total_price: 0,
      measurement: "",
    });
  };

  const handlePurchaseNumberBlur = async () => {
    const value = form.purchase_number.trim();
    if (!value) return;

    try {
      const res = await fetch(PURCHASE_API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return;
      const data = await res.json();
      const duplicate = (data as any[]).some(
        (p) => (p as any).purchase_number === value
      );
      if (duplicate) {
        showToast({
          title: "Duplicate purchase number",
          description: "Purchase number already exists.",
          variant: "error",
        });
      }
    } catch {
      // ignore blur error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTotalCalculated) {
      showToast({
        title: "Calculate total first",
        description: "Please click Calculate Total before submitting.",
        variant: "error",
      });
      return;
    }

    // Check for duplicate purchase number before submitting
    try {
      const existingRes = await fetch(PURCHASE_API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (existingRes.ok) {
        const existingData = await existingRes.json();
        const duplicate = (existingData as any[]).some(
          (p) => (p as any).purchase_number === form.purchase_number
        );
        if (duplicate) {
          showToast({
            title: "Duplicate purchase number",
            description: "Purchase number already exists.",
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
        description: "Please add at least one item to the purchase.",
        variant: "error",
      });
      return;
    }

    const freightTrim = form.freight_price?.trim() ?? "";
    const freightParsed =
      freightTrim === "" ? null : parseFloat(freightTrim);
    const payload = {
      ...form,
      order_date: form.order_date,
      measurement_type: form.measurement_type.trim()
        ? form.measurement_type
        : null,
      freight: form.freight.trim() ? form.freight : null,
      freight_price:
        freightParsed === null || Number.isNaN(freightParsed)
          ? null
          : freightParsed,
      items: items.map((it) => ({
        item_id: it.item_id?.trim() || null,
        item_name: it.item_name,
        price: it.price,
        quantity: it.quantity,
        total_price: it.total_price,
        measurement: it.measurement,
        remaining: it.remaining ?? it.quantity,
        before_vat: it.before_vat ?? it.total_price,
        hscode: it.hscode?.trim() || null,
      })),
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(PURCHASE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          title: "Failed to create purchase",
          description:
            (data as any)?.detail ||
            (data as any)?.message ||
            "Please check the form and try again.",
          variant: "error",
        });
        return;
      }

      showToast({
        title: "Purchase created",
        description: "The purchase has been created successfully.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Failed to create purchase",
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
        <Button onClick={() => router.push("/diredawa/purchase/display")}>
          Display Purchase
        </Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">Create Purchase</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Purchase Number *
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    name="purchase_number"
                    value={form.purchase_number}
                    onChange={handleHeaderChange}
                    onBlur={handlePurchaseNumberBlur}
                    readOnly={!purchaseNumberEditable}
                    title={
                      purchaseNumberEditable
                        ? undefined
                        : "Click the pencil to edit (e.g. M1086)"
                    }
                    className={cn(
                      "min-w-0 flex-1 border rounded-md px-3 py-2",
                      !purchaseNumberEditable &&
                        "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setPurchaseNumberEditable((v) => !v)}
                    aria-label={
                      purchaseNumberEditable
                        ? "Lock purchase number"
                        : "Edit purchase number"
                    }
                    title={
                      purchaseNumberEditable
                        ? "Lock purchase number"
                        : "Edit purchase number"
                    }
                  >
                    {purchaseNumberEditable ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
                <label className="block text-sm font-medium mb-1">
                  Buyer *
                </label>
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Conditions
                </label>
                <input
                  name="conditions"
                  value={form.conditions}
                  onChange={handleHeaderChange}
                  className="w-full border rounded-md px-3 py-2"
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Insurance
                </label>
                <input
                  name="insurance"
                  value={form.insurance}
                  onChange={handleHeaderChange}
                  className="w-full border rounded-md px-3 py-2"
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
              <p className="font-semibold text-sm">Payment Type</p>
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
                      name="payment_type"
                      value={label}
                      checked={form.payment_type === label}
                      onChange={() => handleRadioChange("payment_type", label)}
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
                  onFocus={() => {
                    setItemQuery("");
                    setShowItemDropdown(true);
                  }}
                  className="w-full border rounded-md px-3 py-2"
                  autoComplete="off"
                />
                {showItemDropdown && itemOptions.length > 0 && (
                  <div
                    className="absolute z-[100] top-full mt-1 w-full max-h-48 overflow-y-auto rounded-md border shadow-lg bg-white"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    {itemOptions
                      .filter((opt) =>
                        (opt.item_name ?? "")
                          .toLowerCase()
                          .includes(itemQuery.toLowerCase())
                      )
                      .slice(0, 20)
                      .map((opt) => (
                        <button
                          type="button"
                          key={opt.item_id ?? opt.internal_code ?? opt.item_name}
                          className="block w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                          style={{ backgroundColor: "#ffffff" }}
                          onClick={() => {
                            setCurrentItem((prev) => ({
                              ...prev,
                              item_id: opt.item_id ?? "",
                              item_name: opt.item_name,
                              hscode: opt.hscode ?? "",
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
                <label className="block text-sm font-medium mb-1">HS CODE</label>
                <input
                  name="hscode"
                  value={currentItem.hscode}
                  onChange={handleItemChange}
                  className="w-full border rounded-md px-3 py-2"
                  autoComplete="off"
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
                variant="cta"
                size="lg"
                className="w-full animate-pulse"
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
                      <th className="text-left px-3 py-2">Purchase No.</th>
                      <th className="text-left px-3 py-2">Item</th>
                      <th className="text-left px-3 py-2">HS Code</th>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Remaining</th>
                      <th className="text-right px-3 py-2">Price</th>
                      <th className="text-right px-3 py-2">Total</th>
                      <th className="text-right px-3 py-2">Before VAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs">
                          {(it.purchase_number ?? form.purchase_number) || "—"}
                        </td>
                        <td className="px-3 py-2">{it.item_name}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {it.hscode ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          {it.remaining ?? it.quantity}
                        </td>
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
                        <td className="px-3 py-2 text-right">
                          {(it.before_vat ?? it.total_price).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )}
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
              disabled={isSubmitting || !isTotalCalculated}
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

