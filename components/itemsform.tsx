"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { SearchableDropdown, type DropdownOption } from "@/components/searchable-dropdown";
import { parseInventoryItemsJson } from "@/lib/parseInventoryItems";

const ITEMS_API_URL = "/api/inventory/items";

type ItemDropdownOption = DropdownOption & {
  internalCode?: string;
  /** Inventory row id — sent to GRN/DN API so the backend can validate items without relying on internal_code alone. */
  itemId?: string;
};

export function ItemsForm() {
  const { control, register, setValue, watch } = useFormContext();
  const [itemOptions, setItemOptions] = useState<ItemDropdownOption[]>([]);

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
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const parsed = parseInventoryItemsJson(data);
        setItemOptions(
          parsed.map((item, idx) => {
            const id = item.item_id?.trim();
            const name = item.item_name;
            const code = item.internal_code?.trim();
            return {
              // Stable unique value for keys and selection; avoids wrong row when names duplicate.
              value:
                id && id.length > 0 ? id : `${idx}::${name}::${code ?? ""}`,
              display: name,
              subtext: item.hscode || code || undefined,
              internalCode: code || undefined,
              itemId: item.item_id ? String(item.item_id) : undefined,
            };
          })
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
              item_id: "",
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
            <input type="hidden" {...register(`items.${index}.item_id` as const)} />
            <Label>
              Item Name <span className="text-destructive">*</span>
            </Label>
            <SearchableDropdown
              value={(items[index]?.item_name as string) || ""}
              tieBreakHint={String(items[index]?.internal_code ?? "").trim()}
              onChange={(value, option) => {
                const selected = option as ItemDropdownOption | undefined;
                const name = selected?.display ?? value;
                setValue(`items.${index}.item_name` as const, name, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                const code = selected?.internalCode?.trim() ?? "";
                setValue(`items.${index}.internal_code` as const, code, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue(`items.${index}.item_id` as const, selected?.itemId ?? "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              options={itemOptions}
              placeholder="Search item..."
            />
          </div>

          <div>
            <Label>
              Quantity <span className="text-destructive">*</span>
            </Label>
            <Input type="number" {...register(`items.${index}.quantity` as const)} />
          </div>

          <div>
            <Label>
              Unit Measurement <span className="text-destructive">*</span>
            </Label>
            <Input type="text" {...register(`items.${index}.unit_measurement` as const)} />
          </div>

          <div>
            <Label>
              Bags/Cartoon <span className="text-destructive">*</span>
            </Label>
            <Input type="number" {...register(`items.${index}.bags` as const)} />
          </div>

          <div className="flex gap-4 md:col-span-2">
            <div className="flex-1">
              <Label>Internal Code</Label>
            <Controller
              control={control}
              name={`items.${index}.internal_code`}
              render={({ field }) => (
                <Input
                  type="text"
                  {...field}
                  readOnly
                  tabIndex={-1}
                  className="bg-muted cursor-default"
                  value={field.value ?? ""}
                />
              )}
            />
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
