 "use client";

import { useMemo, useState } from "react";
import { Form } from "@/components/form";
import { ItemsForm } from "@/components/itemsform";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { useFormContext } from "react-hook-form";
import {
  fetchDisplayValueSet,
  fetchInventoryItemNameSet,
  isInSet,
} from "@/lib/referenceListValidation";
import { resolveGrnDnLinesFromInventory } from "@/lib/resolveGrnDnInventoryItems";

interface GrnFormValues {
  date: string;
  grn_no: string;
  supplier_name: string;
  received_from: string;
  truck_no: string;
  purchase_no: string;
  store_name: string;
  store_keeper: string;
  total_quantity?: number;
  ECD_no: string;
  transporter_name: string;
  items: {
    item_id?: string;
    item_name: string;
    quantity: number;
    unit_measurement: string;
    internal_code: string;
    bags: number;
  }[];
}

const GRN_API_URL = "/api/inventory/grn"

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isTotalCalculated, setIsTotalCalculated] = useState(false);
  const [grnNoDuplicate, setGrnNoDuplicate] = useState(false);
  const [checkingGrnNo, setCheckingGrnNo] = useState(false);

  function TotalQuantityCalculator({ onCalculated }: { onCalculated: (qty: number) => void }) {
    const { watch } = useFormContext<GrnFormValues>();
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

  const handleSubmit = async (values: GrnFormValues) => {
    
    console.log("Form submitted:", values);

    if (!isTotalCalculated) {
      showToast({
        title: "Calculate total first",
        description: "Please click Calculate Total before submitting.",
        variant: "error",
      });
      return;
    }

    if (grnNoDuplicate) {
      showToast({
        title: "GRN No already exists",
        description: "Please enter a different GRN number.",
        variant: "error",
      });
      return;
    }

    if (!values.purchase_no || !String(values.purchase_no).trim()) {
      showToast({
        title: "Purchase required",
        description: "Please select a purchase number.",
        variant: "error",
      });
      return;
    }

    try {
      const [purchaseSet, supplierSet, itemNameSet] = await Promise.all([
        fetchDisplayValueSet("/api/purchases", "purchase_number"),
        fetchDisplayValueSet("/api/partners/suppliers", "name"),
        fetchInventoryItemNameSet(),
      ]);
      const pPurchase = String(values.purchase_no ?? "").trim();
      if (!isInSet(pPurchase, purchaseSet)) {
        showToast({
          title: "Invalid purchase number",
          description: "Choose a purchase number from the dropdown list.",
          variant: "error",
        });
        return;
      }
      const pSupplier = String(values.supplier_name ?? "").trim();
      if (!isInSet(pSupplier, supplierSet)) {
        showToast({
          title: "Invalid supplier",
          description: "Choose a supplier from the dropdown list.",
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
        title: "GRN items required",
        description: "Please add at least one item from the list.",
        variant: "error",
      });
      return;
    }

    const hasInvalidItems = items.some((it) => {
      const itemName = String(it.item_name ?? "").trim();
      const qty = Number(it.quantity ?? 0);
      // Item name is already validated against inventory; internal_code may be empty for some items.
      return !itemName || !Number.isFinite(qty) || qty <= 0;
    });

    if (hasInvalidItems) {
      showToast({
        title: "Select valid items",
        description:
          "Each GRN line needs an item chosen from the list and a quantity greater than zero.",
        variant: "error",
      });
      return;
    }

    const computedTotalQuantity = items.reduce((sum, it) => {
      const n = Number(it.quantity ?? 0);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

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
      supplier_name: values.supplier_name,
      grn_no: values.grn_no,
      received_from: values.received_from,
      truck_no: values.truck_no,
      purchase_no: values.purchase_no, // fallback for backend validation
      total_quantity: computedTotalQuantity,
      store_name: values.store_name,
      store_keeper: values.store_keeper,
      date: values.date, // ISO string is fine
      ECD_no: values.ECD_no, // ensure correct case
      transporter_name: values.transporter_name,
      items: resolvedItems.lines.map((line) => ({
        ...(line.item_id ? { item_id: line.item_id } : {}),
        item_name: line.item_name,
        quantity: line.quantity,
        unit_measurement: line.unit_measurement,
        bags: line.bags,
        internal_code: line.internal_code,
      })),
    };
  
    console.log("Payload sent to backend:", payload);
  
    try {
      const res = await fetch(GRN_API_URL, {
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
        console.error("Error creating GRN:", data);
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
          title: "Failed to create GRN",
          description: message,
          variant: "error",
        });
        return;
      }
  
      console.log("GRN created successfully:", data);
      showToast({
        title: "GRN created",
        description: "The GRN has been created successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error creating GRN:", error);
      showToast({
        title: "Failed to create GRN",
        description: "Something went wrong. Please try again.",
        variant: "error",
      });
    }
  };

  
  
  return (
    
    <div className="max-w-xl mx-auto mt-4">
      <div className="flex justify-start mb-10">
      <Button onClick={() => router.push("/diredawa/inventory/grn/display")}> Display GRN</Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-2 text-center">Create GRN</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Fields marked <span className="text-destructive">*</span> are required. Each item line must be chosen from the inventory list.
      </p>

      <Form<GrnFormValues>
        defaultValues={{ items: [] }}
        fields={[
          { name: "date", label: "Date", type: "date", placeholder: "Enter Date", required: true },
          {
            name: "grn_no",
            label: "GRN No",
            required: true,
            placeholder: "Enter GRN No",
            onBlur: async (val) => {
              const v = String(val ?? "").trim();
              if (!v) {
                setGrnNoDuplicate(false);
                return;
              }
              if (checkingGrnNo) return;
              setCheckingGrnNo(true);
              try {
                const res = await fetch(`${GRN_API_URL}/${encodeURIComponent(v)}`);
                if (res.ok) {
                  setGrnNoDuplicate(true);
                  showToast({
                    title: "GRN No already exists",
                    description: "This GRN number is already used. Please change it.",
                    variant: "error",
                  });
                } else if (res.status === 404) {
                  setGrnNoDuplicate(false);
                }
              } catch {
                // keep current state
              } finally {
                setCheckingGrnNo(false);
              }
            },
          },
          { name: "supplier_name", label: "Supplier Name", required: true, placeholder: "Search supplier...", dropdownConfig: { url: "/api/partners/suppliers", displayKey: "name" } },
          { name: "received_from", label: "Received From", placeholder: "Enter Received From" },
          { name: "truck_no", label: "Truck No", placeholder: "Enter Truck No" },
          { name: "purchase_no", label: "Purchase No", required: true, placeholder: "Search purchase...", dropdownConfig: { url: "/api/purchases", displayKey: "purchase_number" } },
          { name: "ECD_no", label: "ECD no", placeholder: "Enter ECD No" },
          { name: "transporter_name", label: "Transporter Name", placeholder: "Enter Transporter Name" },
          { name: "store_name", label: "Store Name", placeholder: "Enter Store Name" },
          { name: "store_keeper", label: "Store Keeper", placeholder: "Enter Store Keeper" },
        ]}
        onSubmit={handleSubmit}
        submitText="Submit GRN"
      >
        <h2 className="text-center font-semibold mt-4">
          GRN Items <span className="text-destructive">*</span>
        </h2>
        <p className="text-xs text-center text-muted-foreground mb-2">
          At least one line: item from list, quantity, unit, bags — then Calculate Total.
        </p>
        <ItemsForm />
        <TotalQuantityCalculator
          onCalculated={(qty) => {
            setIsTotalCalculated(true);
          }}
        />
      </Form>
    </div>
  );
}