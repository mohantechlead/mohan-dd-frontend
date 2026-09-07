"use client";

import { useEffect, useState } from "react";
import { Form } from "@/components/form";
import { ItemsForm } from "@/components/itemsform";
import { ExpirationFeeTiersForm } from "@/components/expiration-fee-tiers-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { formatApiErrorMessage } from "@/lib/apiErrorMessage";
import { parseDecimalQuantity } from "@/lib/inventoryQuantity";
import { WSN_API_URL, PERIOD_UNITS, WSN_NEXT_NUMBER_URL } from "@/lib/warehouse";

interface WSNFormValues {
  wsn_no: string;
  customer_name: string;
  date: string;
  ECD_no: string;
  remark?: string;
  storage_period_value: number;
  storage_period_unit: string;
  grace_period_value: number;
  grace_period_unit: string;
  items: {
    item_id?: string;
    item_name: string;
    code: string;
    quantity: number;
    unit_measurement: string;
    bags: number | string;
    internal_code: string;
  }[];
  expiration_fee_tiers: {
    tier_index: number;
    period_value: number;
    period_unit: string;
    fee_amount: number;
  }[];
}

export default function CreateWarehouseStorageNotePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [nextNumber, setNextNumber] = useState("");

  useEffect(() => {
    fetch(WSN_NEXT_NUMBER_URL, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.next_number === "string") {
          setNextNumber(data.next_number);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (values: WSNFormValues) => {
    const items = values.items ?? [];
    if (items.length === 0) {
      showToast({
        title: "Items required",
        description: "Please add at least one item line.",
        variant: "error",
      });
      return;
    }

    const hasInvalidItems = items.some((it) => {
      const itemName = String(it.item_name ?? "").trim();
      const qty = parseDecimalQuantity(it.quantity);
      return !itemName || !Number.isFinite(qty) || qty <= 0;
    });
    if (hasInvalidItems) {
      showToast({
        title: "Select valid items",
        description: "Each line needs an item and a quantity greater than zero.",
        variant: "error",
      });
      return;
    }

    const tiers = (values.expiration_fee_tiers ?? [])
      .map((t) => ({
        tier_index: Number(t.tier_index),
        period_value: Number(t.period_value),
        period_unit: String(t.period_unit ?? "months").trim(),
        fee_amount: Number(t.fee_amount),
      }))
      .filter(
        (t) =>
          Number.isFinite(t.tier_index) &&
          Number.isFinite(t.period_value) &&
          Number.isFinite(t.fee_amount),
      );

    const payload = {
      wsn_no: String(values.wsn_no ?? "").trim() || String(nextNumber || "").trim(),
      customer_name: String(values.customer_name ?? "").trim(),
      date: values.date || null,
      ECD_no: String(values.ECD_no ?? "").trim() || null,
      remark: String(values.remark ?? "").trim() || null,
      storage_period_value: Number(values.storage_period_value),
      storage_period_unit: String(values.storage_period_unit ?? "months").trim(),
      grace_period_value: Number(values.grace_period_value ?? 0),
      grace_period_unit:
        String(values.grace_period_unit ?? "days").trim() || "days",
      items: items.map((line) => {
        const bagsRaw = line.bags;
        const bagsParsed =
          bagsRaw === "" || bagsRaw === null || bagsRaw === undefined
            ? null
            : Number(bagsRaw);
        return {
          ...(line.item_id ? { item_id: line.item_id } : {}),
          item_name: String(line.item_name ?? "").trim(),
          code: String(line.internal_code ?? "").trim() || null,
          quantity: parseDecimalQuantity(line.quantity),
          unit_measurement: String(line.unit_measurement ?? "").trim(),
          bags:
            bagsParsed !== null && Number.isFinite(bagsParsed)
              ? bagsParsed
              : null,
          internal_code: String(line.internal_code ?? "").trim() || null,
        };
      }),
      expiration_fee_tiers: tiers,
    };

    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(WSN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const rawText = await res.text();
      let data: unknown = {};
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { detail: rawText.slice(0, 500) };
        }
      }
      if (!res.ok) {
        showToast({
          title: "Failed to create Storage Note",
          description: formatApiErrorMessage(data),
          variant: "error",
        });
        return;
      }
      showToast({
        title: "Storage Note created",
        description: "The storage note has been created successfully.",
        variant: "success",
      });
      router.push("/diredawa/inventory/warehouse-storage-notes/display");
    } catch (error) {
      console.error("Error creating storage note:", error);
      showToast({
        title: "Failed to create Storage Note",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="flex justify-start mb-6">
        <Button
          onClick={() =>
            router.push("/diredawa/inventory/warehouse-storage-notes/display")
          }
        >
          Display Storage Notes
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-center">
        Create Storage Note
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Fields marked <span className="text-destructive">*</span> are required.
        Each item line must be chosen from the inventory list. Add expiration
        fee tiers to bill after expiry.
      </p>

      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">
          Storage Note No (auto-generated):
        </span>
        <span className="text-sm font-semibold text-primary">
          {nextNumber || "Loading..."}
        </span>
      </div>

      <Form<WSNFormValues>
        defaultValues={{
          items: [],
          expiration_fee_tiers: [],
          storage_period_unit: "months",
          grace_period_unit: "days",
          grace_period_value: 0,
        }}
        fields={[
          { name: "date", label: "Date", type: "date", required: true },
          {
            name: "customer_name",
            label: "Customer Name",
            required: true,
            placeholder: "Search customer...",
            dropdownConfig: { url: "/api/partners/customers", displayKey: "name" },
          },
          { name: "ECD_no", label: "ECD No", placeholder: "Enter ECD No" },
          {
            name: "storage_period_value",
            label: "Storage Period Value",
            required: true,
            type: "number",
            placeholder: "e.g. 1",
          },
          {
            name: "storage_period_unit",
            label: "Storage Period Unit",
            required: true,
            type: "select",
            selectOptions: [...PERIOD_UNITS],
            placeholder: "Select period unit",
          },
          {
            name: "grace_period_value",
            label: "Grace Period Value",
            type: "number",
            placeholder: "e.g. 0",
          },
          {
            name: "grace_period_unit",
            label: "Grace Period Unit",
            type: "select",
            selectOptions: [...PERIOD_UNITS],
            placeholder: "Select period unit",
          },
          {
            name: "remark",
            label: "Remark (optional)",
            type: "textarea",
            placeholder: "Optional notes",
          },
        ]}
        onSubmit={handleSubmit}
        submitText={submitting ? "Submitting..." : "Submit Storage Note"}
      >
        <h2 className="text-center font-semibold mt-4">
          Storage Items <span className="text-destructive">*</span>
        </h2>
        <p className="text-xs text-center text-muted-foreground mb-2">
          Add at least one item line received into storage.
        </p>
        <ItemsForm hideCode />
        <ExpirationFeeTiersForm />
      </Form>
    </div>
  );
}
