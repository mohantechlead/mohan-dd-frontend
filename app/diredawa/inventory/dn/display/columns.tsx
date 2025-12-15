"use client"

import { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type DNItem = {
  item_name: string
  quantity: number
  unit_measurement: string
}

export type DN = {
  dn_no: string
  customer_name: string
  sales_no: string
  items: DNItem
}

export const columns: ColumnDef<DN>[] = [
{
        accessorKey: "dn_no",
        header: "DN No",
      },
  {
    accessorKey: "customer_name",
    header: "Customer Name",
  },
 
  {
    accessorKey: "sales_no",
    header: "Sales No",
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