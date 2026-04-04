 "use client";

import { useMemo, useState } from "react";
import { Form } from "@/components/form";
import { ItemsForm } from "@/components/itemsform";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { useFormContext } from "react-hook-form";
import { OverUnderNotification } from "@/components/over-under-notification";
import {
  fetchDisplayValueSet,
  fetchInventoryItemNameSet,
  isInSet,
} from "@/lib/referenceListValidation";
import { resolveGrnDnLinesFromInventory } from "@/lib/resolveGrnDnInventoryItems";

interface DnFormValues {
  date: string;
  dn_no: string;
  customer_name: string;
  plate_no: string;
  sales_no: string;
  ECD_no: string;
  gatepass_no: string;
  invoice_no: string;
  despathcher_name: string;
  receiver_name: string;
  receiver_phone: string;
  authorized_by: string;
  total_quantity?: number;
  items: {
    item_id?: string;
    item_name: string;
    quantity: number;
    unit_measurement: string;
    internal_code: string;
    bags: number;
  }[];
}

const DN_API_URL = "/api/inventory/dn"

interface OverUnderItem {
  item_name: string;
  invoiced: number;
  delivered: number;
  variance: number;
}

export default function DN() {
  const router = useRouter();
  const { showToast } = useToast();
  const [overUnderOpen, setOverUnderOpen] = useState(false);
  const [overUnderData, setOverUnderData] = useState<{
    dnNo: string;
    overItems: OverUnderItem[];
    underItems: OverUnderItem[];
  } | null>(null);
  const [dnNoDuplicate, setDnNoDuplicate] = useState(false);
  const [checkingDnNo, setCheckingDnNo] = useState(false);
  const [isTotalCalculated, setIsTotalCalculated] = useState(false);

  function TotalQuantityCalculator({ onCalculated }: { onCalculated: (qty: number) => void }) {
    const { watch } = useFormContext<DnFormValues>();
    const items = watch("items") || [];

    const computedTotal = useMemo(() => {
      return (items as Array<{ quantity?: number | string | null }>).reduce((sum, it) => {
        const n = Number(it.quantity ?? 0);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0);
    }, [items]);

    return (
      <div className="flex flex-col gap-2 mt-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Total Quantity: {computedTotal}</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onCalculated(computedTotal);
            }}
          >
            Calculate Total
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Click <span className="font-medium">Calculate Total</span> before submitting.
        </p>
      </div>
    );
  }

  const handleSubmit = async (values: DnFormValues) => {
    console.log("Form submitted:", values);

    if (!isTotalCalculated) {
      showToast({
        title: "Calculate total first",
        description: "Please click Calculate Total before submitting.",
        variant: "error",
      });
      return;
    }

    if (dnNoDuplicate) {
      showToast({
        title: "Delivery Note number already exists",
        description: "Please enter a different DN number.",
        variant: "error",
      });
      return;
    }

    try {
      const [orderSet, customerSet, itemNameSet] = await Promise.all([
        fetchDisplayValueSet("/api/orders", "order_number"),
        fetchDisplayValueSet("/api/partners/customers", "name"),
        fetchInventoryItemNameSet(),
      ]);
      const salesNo = String(values.sales_no ?? "").trim();
      if (!isInSet(salesNo, orderSet)) {
        showToast({
          title: "Invalid order number",
          description: "Choose an order from the dropdown list.",
          variant: "error",
        });
        return;
      }
      const customer = String(values.customer_name ?? "").trim();
      if (!isInSet(customer, customerSet)) {
        showToast({
          title: "Invalid customer",
          description: "Choose a customer from the dropdown list.",
          variant: "error",
        });
        return;
      }
      const invoiceUrl = `/api/inventory/shipping-invoices?order_number=${encodeURIComponent(salesNo)}`;
      const invoiceSet = await fetchDisplayValueSet(invoiceUrl, "invoice_number");
      const inv = String(values.invoice_no ?? "").trim();
      if (!isInSet(inv, invoiceSet)) {
        showToast({
          title: "Invalid invoice number",
          description:
            invoiceSet.size === 0
              ? "There are no shipping invoices for this order. Add shipping details first, then pick an invoice from the list."
              : "Choose an invoice number from the dropdown list for the selected order.",
          variant: "error",
        });
        return;
      }
      for (const it of values.items ?? []) {
        const nm = String(it.item_name ?? "").trim();
        if (nm && !isInSet(nm, itemNameSet)) {
          showToast({
            title: "Invalid item",
            description: `Each line must use an item from the list. "${nm}" is not recognized.`,
            variant: "error",
          });
          return;
        }
      }
    } catch {
      showToast({
        title: "Could not verify selections",
        description: "Please check your connection and try again.",
        variant: "error",
      });
      return;
    }

    const items = values.items ?? [];
    if (items.length === 0) {
      showToast({
        title: "Delivery note items required",
        description: "Please add at least one item from the list.",
        variant: "error",
      });
      return;
    }

    const hasInvalidItems = items.some((it) => {
      const itemName = String(it.item_name ?? "").trim();
      const qty = Number(it.quantity ?? 0);
      return !itemName || !Number.isFinite(qty) || qty <= 0;
    });

    if (hasInvalidItems) {
      showToast({
        title: "Select valid items",
        description:
          "Each DN line needs an item chosen from the list and a quantity greater than zero.",
        variant: "error",
      });
      return;
    }

    const resolvedItems = await resolveGrnDnLinesFromInventory(values.items ?? []);
    if (!resolvedItems.ok) {
      showToast({
        title: "Invalid items",
        description: resolvedItems.message,
        variant: "error",
      });
      return;
    }

    // Transform values to match backend schema exactly
    const payload = {
      customer_name: values.customer_name,
      dn_no: values.dn_no,
      plate_no: values.plate_no,
      sales_no: values.sales_no,
      date: values.date, // ISO string is fine
      ECD_no: values.ECD_no, // ensure correct case
      gatepass_no: values.gatepass_no,
      invoice_no: values.invoice_no,
      despathcher_name: values.despathcher_name,
      receiver_name: values.receiver_name,
      authorized_by: values.authorized_by,
      items: resolvedItems.lines.map((line) => ({
        ...(line.item_id ? { item_id: line.item_id } : {}),
        item_name: line.item_name,
        quantity: line.quantity,
        unit_measurement: line.unit_measurement,
        bags: Number(line.bags),
        internal_code: line.internal_code,
      })),
    };
  
    console.log("Payload sent to backend:", payload);
  
    try {
      const res = await fetch(DN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
  
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        console.error("Error creating DN:", data);
        const err = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
        const message =
          typeof err?.detail === "string"
            ? err.detail
            : Array.isArray(err?.detail)
              ? (err.detail as string[]).join(". ")
              : typeof err?.message === "string"
                ? err.message
                : typeof err?.error === "string"
                  ? err.error
                  : "Please check the form and try again.";
        showToast({
          title: "Failed to create Delivery Note",
          description: message,
          variant: "error",
        });
        return;
      }
  
      console.log("DN created successfully:", data);
      const resData = data as { dn_no?: string; over_items?: OverUnderItem[]; under_items?: OverUnderItem[] };
      showToast({
        title: "Delivery Note created",
        description: "The delivery note has been created successfully.",
        variant: "success",
      });
      if (
        (resData.over_items && resData.over_items.length > 0) ||
        (resData.under_items && resData.under_items.length > 0)
      ) {
        setOverUnderData({
          dnNo: resData.dn_no || "",
          overItems: resData.over_items || [],
          underItems: resData.under_items || [],
        });
        setOverUnderOpen(true);
      }
    } catch (error) {
      console.error("Error creating DN:", error);
      const msg = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      showToast({
        title: "Failed to create Delivery Note",
        description: msg,
        variant: "error",
      });
    }
  };
  

  return (
    <div className="max-w-3xl mx-auto mt-10">

      <div>
        <Button onClick={() => router.push('/diredawa/inventory/dn/display')}>Display Delivery Notes</Button>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-center">Create Delivery Note</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Fields marked <span className="text-destructive">*</span> are required. Each item line must be chosen from the inventory list.
      </p>

      <Form<DnFormValues>
        defaultValues={{ items: [] }}
        fields={[
          { name: "date", label: "Date", type: "date", placeholder: "Enter Date", required: true },
          {
            name: "dn_no",
            label: "Delivery Number",
            required: true,
            placeholder: "Enter Delivery Number",
            onBlur: async (val) => {
              const v = String(val ?? "").trim();
              if (!v) {
                setDnNoDuplicate(false);
                return;
              }
              if (checkingDnNo) return;
              setCheckingDnNo(true);
              try {
                const res = await fetch(`${DN_API_URL}/${encodeURIComponent(v)}`);
                if (res.ok) {
                  setDnNoDuplicate(true);
                  showToast({
                    title: "Delivery Note number already exists",
                    description: "This DN number is already used. Please change it.",
                    variant: "error",
                  });
                } else if (res.status === 404) {
                  setDnNoDuplicate(false);
                }
              } catch {
                // ignore network errors on blur
              } finally {
                setCheckingDnNo(false);
              }
            },
          },
          { name: "customer_name", label: "Customer Name", required: true, placeholder: "Search customer...", dropdownConfig: { url: "/api/partners/customers", displayKey: "name" } },
          { name: "plate_no", label: "Plate No", placeholder: "Enter Plate No" },
          { name: "sales_no", label: "Order No", required: true, placeholder: "Search order...", dropdownConfig: { url: "/api/orders", displayKey: "order_number" } },
          { name: "ECD_no", label: "ECD No", placeholder: "Enter ECD No" },
          { name: "gatepass_no", label: "Gate Pass Number", placeholder: "Enter Gate Pass Number" },
          {
            name: "invoice_no",
            label: "Invoice Number",
            required: true,
            placeholder: "Search invoice...",
            dependentDropdownConfig: {
              dependsOn: "sales_no",
              urlTemplate: "/api/inventory/shipping-invoices?order_number={value}",
              displayKey: "invoice_number",
            },
          },
          { name: "despathcher_name", label: "Despatcher Name", placeholder: "Enter Despatcher Name" },
          { name: "receiver_name", label: "Reciever Name", placeholder: "Enter Reciever Name" },
          { name: "authorized_by", label: "Authorized By", placeholder: "Enter Authorized By" },
        ]}
        onSubmit={handleSubmit}
        submitText="Submit Delivery Note"
      >
        <h2 className="text-center font-semibold mt-4">
          Delivery Note Items <span className="text-destructive">*</span>
        </h2>
        <p className="text-xs text-center text-muted-foreground mb-2">
          At least one line: item from list, quantity, unit, bags — then Calculate Total.
        </p>
        <ItemsForm />
        <TotalQuantityCalculator
          onCalculated={() => {
            setIsTotalCalculated(true);
          }}
        />
      </Form>

      {overUnderData && (
        <OverUnderNotification
          open={overUnderOpen}
          onOpenChange={setOverUnderOpen}
          dnNo={overUnderData.dnNo}
          overItems={overUnderData.overItems}
          underItems={overUnderData.underItems}
        />
      )}
    </div>
  );
}