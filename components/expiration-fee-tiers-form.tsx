"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { PERIOD_UNITS } from "@/lib/warehouse";

export function ExpirationFeeTiersForm() {
  const { control, register, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: "expiration_fee_tiers",
    control,
  });

  const tiers = watch("expiration_fee_tiers") || [];

  return (
    <div className="flex flex-col gap-4 border p-4 rounded-xl mt-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Expiration Fee Tiers</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const next = tiers.length + 1;
            append({
              tier_index: next,
              period_value: "",
              period_unit: "months",
              fee_amount: "",
            });
          }}
        >
          + Add Tier
        </Button>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Fee applied once a storage note expires. Tier 1 is the 1st period after
        expiry, tier 2 the next, and so on.
      </p>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tiers defined. Add at least one tier for post-expiry billing.
        </p>
      ) : (
        fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 rounded-lg p-4"
          >
            <div>
              <Label>Tier #</Label>
              <Input
                type="number"
                min={1}
                step={1}
                {...register(`expiration_fee_tiers.${index}.tier_index`, {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div>
              <Label>Period Value</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                placeholder="e.g. 1"
                {...register(`expiration_fee_tiers.${index}.period_value`)}
              />
            </div>
            <div>
              <Label>Period Unit</Label>
              <select
                className="w-full h-9 rounded-md border border-input px-3 py-1 text-base shadow-sm md:text-sm"
                {...register(`expiration_fee_tiers.${index}.period_unit`)}
              >
                {PERIOD_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Fee Amount</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  placeholder="e.g. 30"
                  {...register(`expiration_fee_tiers.${index}.fee_amount`)}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
