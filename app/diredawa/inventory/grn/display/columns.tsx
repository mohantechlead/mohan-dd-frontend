"use client"

import { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type GRNItem = {
  item_name: string
  quantity: number
  unit_measurement: string
}

export type GRN = {
  grn_no: string
  supplier_name: number
  purchase_no: string
  items: GRNItem
}

export const columns: ColumnDef<GRN>[] = [
{
        accessorKey: "grn_no",
        header: "GRN No",
      },
  {
    accessorKey: "supplier_name",
    header: "Supplier Name",
  },
 
  {
    accessorKey: "purchase_no",
    header: "Purchase No",
  },
  {accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items; // row.original is your full data object
      return (
        <ul className="list-disc ml-5">
          {items.map((item, idx) => (
            <li key={idx}>
              {item.item_name} - {item.quantity} {item.unit_measurement}
            </li>
          ))}
        </ul>
      );
    },
  }
]