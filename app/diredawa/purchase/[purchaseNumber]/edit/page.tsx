"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { validateLineItemsAgainstInventory } from "@/lib/referenceListValidation";
import {
  parseInventoryItemsJson,
  type InventoryItemOption,
} from "@/lib/parseInventoryItems";

const ITEMS_API_URL = "/api/inventory/items";

interface PurchaseItemApi {
  item_id?: string | null;
  purchase_number?: string;
  item_name: string;
  price: number;
  quantity: number;
  remaining: number;
  total_price: number;
  before_vat?: number;
  hscode?: string | null;
  hs_code?: string | null;
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
  payment_type: string;
  payment_terms?: string | null;
  mode_of_transport: string;
  freight: string;
  freight_price?: number | null;
  insurance?: string | null;
  shipment_type: string;
  items: PurchaseItemApi[];
}

/** Editable line — same shape as sales edit rows, plus purchase-only fields. */
interface PurchaseItemForm {
  item_id: string;
  item_name: string;
  hs_code: string;
  price: string;
  quantity: string;
  total_price: number;
  remaining: string;
  before_vat: number;
  measurement: string;
}

function mapApiLineToForm(it: PurchaseItemApi): PurchaseItemForm {
  const hs = (it.hscode ?? it.hs_code ?? "").toString();
  const qty = Number(it.quantity) || 0;
  const rem = it.remaining ?? qty;
  const total = Number(it.total_price) || 0;
  const before = Number(it.before_vat ?? it.total_price) || total;
  return {
    item_id:
      it.item_id != null && String(it.item_id).trim() !== ""
        ? String(it.item_id)
        : "",
    item_name: it.item_name,
    hs_code: hs,
    price: String(it.price),
    quantity: String(it.quantity),
    total_price: total,
    remaining: String(rem),
    before_vat: before,
    measurement: it.measurement ?? "",
  };
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
    payment_type: "",
    mode_of_transport: "",
    freight: "",
    freight_price: "",
    insurance: "",
    shipment_type: "",
  });

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemForm[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [isTotalCalculated, setIsTotalCalculated] = useState(false);

  const [currentItem, setCurrentItem] = useState<PurchaseItemForm>({
    item_id: "",
    item_name: "",
    hs_code: "",
    price: "",
    quantity: "",
    total_price: 0,
    remaining: "",
    before_vat: 0,
    measurement: "",
  });
  const [itemOptions, setItemOptions] = useState<InventoryItemOption[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null
  );

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
          setItemOptions([]);
          return;
        }
        setItemOptions(parseInventoryItemsJson(data));
      } catch {
        setItemOptions([]);
      }
    };
    fetchItems();
  }, []);

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
          measurement_type: p.measurement_type ?? "",
          payment_type: p.payment_type ?? p.payment_terms ?? "",
          mode_of_transport: p.mode_of_transport,
          freight: p.freight ?? "",
          freight_price:
            p.freight_price != null ? String(p.freight_price) : "",
          insurance: p.insurance || "",
          shipment_type: p.shipment_type,
        });
        const lines = (p.items ?? []).map(mapApiLineToForm);
        setPurchaseItems(lines);
        if (lines.length > 0) {
          const sum = lines.reduce((s, it) => s + (Number(it.total_price) || 0), 0);
          setItemsTotal(sum);
          setIsTotalCalculated(true);
        } else {
          setItemsTotal(0);
          setIsTotalCalculated(false);
        }
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

  const handleCalculateTotal = () => {
    const total = purchaseItems.reduce(
      (sum, it) => sum + (Number(it.total_price) || 0),
      0
    );
    setItemsTotal(total);
    setIsTotalCalculated(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTotalCalculated) {
      showToast({
        title: "Calculate total first",
        description: "Please click Calculate Total before saving.",
        variant: "error",
      });
      return;
    }

    if (purchaseItems.length === 0) {
      showToast({
        title: "No items",
        description: "Purchase must have at least one item.",
        variant: "error",
      });
      return;
    }

    const itemListCheck = await validateLineItemsAgainstInventory(
      purchaseItems,
      "purchase"
    );
    if (!itemListCheck.ok) {
      showToast({
        title: itemListCheck.title,
        description: itemListCheck.description,
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
      measurement_type: form.measurement_type.trim()
        ? form.measurement_type
        : null,
      payment_type: form.payment_type,
      mode_of_transport: form.mode_of_transport,
      freight: form.freight.trim() ? form.freight : null,
      freight_price: form.freight_price ? Number(form.freight_price) : null,
      insurance: form.insurance || null,
      shipment_type: form.shipment_type,
      items: purchaseItems.map((it) => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const total = Number(it.total_price) || 0;
        const remStr = it.remaining.trim();
        const rem = remStr === "" ? qty : Number(remStr);
        const remaining = Number.isFinite(rem) ? Math.min(rem, qty) : qty;
        const beforeVat = Number(it.before_vat);
        return {
          item_id: it.item_id.trim() || null,
          item_name: it.item_name,
          price,
          quantity: qty,
          total_price: total,
          measurement: it.measurement,
          remaining,
          before_vat: Number.isFinite(beforeVat) ? beforeVat : total,
          hscode: it.hs_code.trim() || null,
        };
      }),
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
              <label className="block font-medium mb-1">Payment Type</label>
              <input
                value={form.payment_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    payment_type: e.target.value,
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

          {/* Items — same pattern as sales (order) edit */}
          <div className="border rounded-md p-4 space-y-4">
            <h2 className="font-semibold text-sm">Purchase items</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 border rounded-lg p-4">
              <div className="relative">
                <label className="block font-medium mb-1">Item name</label>
                <input
                  value={currentItem.item_name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCurrentItem((prev) => ({
                      ...prev,
                      item_name: value,
                      item_id: "",
                    }));
                    setItemQuery(value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowItemDropdown(false), 150)
                  }
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
                        (opt.item_name ?? "")
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
                              item_id: opt.item_id ?? "",
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
                <label className="block font-medium mb-1">HS CODE</label>
                <input
                  value={currentItem.hs_code}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({
                      ...prev,
                      hs_code: e.target.value,
                      item_id: "",
                    }))
                  }
                  className="w-full border rounded-md px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Price</label>
                <input
                  type="number"
                  step="any"
                  value={currentItem.price}
                  onChange={(e) => {
                    const price = Number(e.target.value) || 0;
                    const qty = Number(currentItem.quantity) || 0;
                    const total = price * qty;
                    setCurrentItem((prev) => ({
                      ...prev,
                      price: e.target.value,
                      total_price: total,
                      before_vat: total,
                    }));
                  }}
                  className="w-full border rounded-md px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  step="any"
                  value={currentItem.quantity}
                  onChange={(e) => {
                    const qty = Number(e.target.value) || 0;
                    const price = Number(currentItem.price) || 0;
                    const total = price * qty;
                    setCurrentItem((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                      total_price: total,
                      before_vat: total,
                      remaining: e.target.value,
                    }));
                  }}
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
                setPurchaseItems((prev) => [
                  ...prev,
                  {
                    ...currentItem,
                    price: String(priceNum),
                    quantity: String(qtyNum),
                    total_price: total,
                    remaining: String(qtyNum),
                    before_vat: total,
                  },
                ]);
                setIsTotalCalculated(false);
                setCurrentItem({
                  item_id: "",
                  item_name: "",
                  hs_code: "",
                  price: "",
                  quantity: "",
                  total_price: 0,
                  remaining: "",
                  before_vat: 0,
                  measurement: "",
                });
              }}
            >
              Add Item
            </Button>

            {purchaseItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {purchaseItems.map((it, idx) => (
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
                        setPurchaseItems((prev) =>
                          prev.filter((_, i) => i !== idx)
                        );
                        setOpenDropdownIndex(null);
                        setIsTotalCalculated(false);
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
                            setPurchaseItems((prev) => {
                              const next = [...prev];
                              next[idx] = {
                                ...next[idx],
                                item_name: value,
                                item_id: "",
                              };
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
                                (opt.item_name ?? "")
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
                                    setPurchaseItems((prev) => {
                                      const next = [...prev];
                                      const row = next[idx];
                                      const price = Number(row.price) || 0;
                                      const qty = Number(row.quantity) || 0;
                                      const total = price * qty;
                                      next[idx] = {
                                        ...row,
                                        item_id: opt.item_id ?? "",
                                        item_name: opt.item_name,
                                        hs_code: opt.hscode ?? "",
                                        total_price: total,
                                        before_vat: total,
                                      };
                                      return next;
                                    });
                                    setItemQuery("");
                                    setOpenDropdownIndex(null);
                                    setIsTotalCalculated(false);
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
                            setPurchaseItems((prev) => {
                              const next = [...prev];
                              next[idx] = {
                                ...next[idx],
                                hs_code: e.target.value,
                                item_id: "",
                              };
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
                          step="any"
                          value={it.price}
                          onChange={(e) => {
                            const priceStr = e.target.value;
                            const price = Number(priceStr) || 0;
                            const qty = Number(it.quantity) || 0;
                            const total = qty * price;
                            setPurchaseItems((prev) => {
                              const next = [...prev];
                              next[idx] = {
                                ...next[idx],
                                price: priceStr,
                                total_price: total,
                                before_vat: total,
                              };
                              return next;
                            });
                            setIsTotalCalculated(false);
                          }}
                          className="w-full border rounded-md px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Quantity</label>
                        <input
                          type="number"
                          step="any"
                          value={it.quantity}
                          onChange={(e) => {
                            const qtyStr = e.target.value;
                            const qty = Number(qtyStr) || 0;
                            const price = Number(it.price) || 0;
                            const total = qty * price;
                            const prevRem = Number(it.remaining) || 0;
                            const newRem = Math.min(prevRem, qty);
                            setPurchaseItems((prev) => {
                              const next = [...prev];
                              next[idx] = {
                                ...next[idx],
                                quantity: qtyStr,
                                total_price: total,
                                before_vat: total,
                                remaining: String(newRem),
                              };
                              return next;
                            });
                            setIsTotalCalculated(false);
                          }}
                          className="w-full border rounded-md px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Remaining</label>
                        <input
                          type="number"
                          step="any"
                          value={it.remaining}
                          onChange={(e) => {
                            const qty = Number(it.quantity) || 0;
                            let rem = Number(e.target.value) || 0;
                            if (rem > qty) rem = qty;
                            if (rem < 0) rem = 0;
                            setPurchaseItems((prev) => {
                              const next = [...prev];
                              next[idx] = {
                                ...next[idx],
                                remaining: String(rem),
                              };
                              return next;
                            });
                            setIsTotalCalculated(false);
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
                        <label className="block font-medium mb-1">Before VAT</label>
                        <input
                          type="number"
                          step="any"
                          value={it.before_vat}
                          onChange={(e) => {
                            const v = Number(e.target.value) || 0;
                            setPurchaseItems((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], before_vat: v };
                              return next;
                            });
                            setIsTotalCalculated(false);
                          }}
                          className="w-full border rounded-md px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Measurement</label>
                        <input
                          value={it.measurement}
                          onChange={(e) =>
                            setPurchaseItems((prev) => {
                              const next = [...prev];
                              next[idx] = {
                                ...next[idx],
                                measurement: e.target.value,
                              };
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
                onClick={() =>
                  router.push(`/diredawa/purchase/${purchaseNumber}`)
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !isTotalCalculated ||
                  purchaseItems.length === 0 ||
                  purchaseItems.some((it) => !(Number(it.total_price) > 0))
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
