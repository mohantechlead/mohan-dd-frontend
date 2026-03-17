"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { SearchableDropdown, type DropdownOption } from "@/components/searchable-dropdown";

const ITEMS_API_URL = "/api/inventory/items";

export function ItemsForm() {
  const { control, register, setValue, watch } = useFormContext();
  const [itemOptions, setItemOptions] = useState<DropdownOption[]>([]);

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control,
  });

  const items = watch("items") || [];

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch(ITEMS_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        setItemOptions(
          data.map((item: { item_name: string; hscode?: string; internal_code?: string | null }) => ({
            value: item.item_name,
            display: item.item_name,
            subtext: item.hscode || item.internal_code || undefined,
            internalCode: item.internal_code || undefined,
          }))
        );
      } catch {
        // ignore
      }
    }
    loadItems();
  }, []);

  return (
    <div className="flex flex-col gap-4 border p-4 rounded-xl mt-4">
      <div className="flex justify-between">
        <h2 className="font-semibold text-lg">Items</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              item_name: "",
              quantity: "",
              unit_measurement: "",
              bags: "",
              internal_code: "",
            })
          }
        >
          + Add Item
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 rounded-lg p-4">
          <div>
            <Label>Item Name</Label>
            <SearchableDropdown
              value={(items[index]?.item_name as string) || ""}
              onChange={(value) => {
                setValue(`items.${index}.item_name` as const, value);
                const opt = itemOptions.find((o) => o.display === value) as (DropdownOption & { internalCode?: string }) | undefined;
                if (opt?.internalCode) setValue(`items.${index}.internal_code` as const, opt.internalCode);
              }}
              options={itemOptions}
              placeholder="Search item..."
            />
          </div>

          <div>
            <Label>Quantity</Label>
            <Input type="number" {...register(`items.${index}.quantity` as const)} />
          </div>

          <div>
            <Label>Unit Measurement</Label>
            <Input type="text" {...register(`items.${index}.unit_measurement` as const)} />
          </div>

          <div>
            <Label>Bags/Cartoon</Label>
            <Input type="number" {...register(`items.${index}.bags` as const)} />
          </div>

          <div className="flex gap-4 md:col-span-2">
            <div className="flex-1">
              <Label>Internal Code</Label>
              <Input type="text" {...register(`items.${index}.internal_code` as const)} />
            </div>

            <Button
              type="button"
              variant="destructive"
              onClick={() => remove(index)}
              className="mt-6"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
