 "use client";

import { useState } from "react";
import { Form } from "@/components/form";
import { ItemsForm } from "@/components/itemsform";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { OverUnderNotification } from "@/components/over-under-notification";

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
  items: {
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
  const handleSubmit = async (values: DnFormValues) => {
    console.log("Form submitted:", values);

    if (dnNoDuplicate) {
      showToast({
        title: "Delivery Note number already exists",
        description: "Please enter a different DN number.",
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
      const internalCode = String(it.internal_code ?? "").trim();
      const qty = Number(it.quantity ?? 0);
      return !itemName || !internalCode || !Number.isFinite(qty) || qty <= 0;
    });

    if (hasInvalidItems) {
      showToast({
        title: "Select valid items",
        description: "Each DN item must be selected from the item list and have quantity > 0.",
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
      items: values.items.map(item => ({
        item_name: item.item_name,
        quantity: Number(item.quantity), // convert string → int
        unit_measurement: String(item.unit_measurement),
        bags: Number(item.bags),
        internal_code: String(item.internal_code),
      })),
    };
  
    console.log("Payload sent to backend:", payload);
  
    try {
      const res = await fetch(DN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // send raw object
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

      <h1 className="text-2xl font-bold mb-6 text-center">Create Delivery Note</h1>

      <Form<DnFormValues>
        defaultValues={{ items: [] }}
        fields={[
          { name: "date", label: "Date", type: "date", placeholder: "Enter Date" },
          {
            name: "dn_no",
            label: "Delivery Number",
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
          { name: "customer_name", label: "Customer Name", placeholder: "Search customer...", dropdownConfig: { url: "/api/partners/customers", displayKey: "name" } },
          { name: "plate_no", label: "Plate No", placeholder: "Enter Plate No" },
          { name: "sales_no", label: "Order No", placeholder: "Search order...", dropdownConfig: { url: "/api/orders", displayKey: "order_number" } },
          { name: "ECD_no", label: "ECD No", placeholder: "Enter ECD No" },
          { name: "gatepass_no", label: "Gate Pass Number", placeholder: "Enter Gate Pass Number" },
          { name: "invoice_no", label: "Invoice Number", placeholder: "Search invoice...", dependentDropdownConfig: { dependsOn: "sales_no", urlTemplate: "/api/inventory/shipping-invoices?order_number={value}", displayKey: "invoice_number" } },
          { name: "despathcher_name", label: "Despatcher Name", placeholder: "Enter Despatcher Name" },
          { name: "receiver_name", label: "Reciever Name", placeholder: "Enter Reciever Name" },
          { name: "authorized_by", label: "Authorized By", placeholder: "Enter Authorized By" },
        ]}
        onSubmit={handleSubmit}
        submitText="Submit Delivery Note"
      >
        <h2 className="text-center font-semibold mt-4">Delivery Note Items</h2>
        <ItemsForm />
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