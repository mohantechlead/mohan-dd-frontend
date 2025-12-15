"use client"

import { useFieldArray, useFormContext, FormProvider } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"

export function ItemsForm() {
  // Access parent form context
  const { control, register } = useFormContext()

  // Dynamic fields (field array)
  const { fields, append, remove } = useFieldArray({
    name: "items",   // ⭐ parent form will collect values as form.items
    control,
  })

  return (
    <div className="flex flex-col gap-4 border p-4 rounded-xl mt-4">
      <div className="flex justify-between">
        <h2 className="font-semibold text-lg">Items</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ item_name: "", quantity: "", unit_measurement: "", bags: "", internal_code: "" })
          }
        >
          + Add Item
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className=" items-end">
          <div>
            <Label>Item Name</Label>
            <Input {...register(`items.${index}.item_name` as const)} />
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

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Internal Code</Label>
              <Input
                type="text"
                {...register(`items.${index}.internal_code` as const)}
              />
            </div>

            <Button
              type="button"
              variant="destructive"
              onClick={() => remove(index)}
              className="mt-4"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
