"use client"

import { ColumnDef } from "@tanstack/react-table"

export type Items = {
  item_name: string
  quantity: string
  package: string
}

export const columns: ColumnDef<Items>[] = [
{
        accessorKey: "item_name",
        header: "Item Name",
      },
  
      {
        accessorKey: "internal_code",
        header: "Internal Code",
      },
  {
    accessorKey: "quantity",
    header: "Stock Quantity",
  },
 
  {
    accessorKey: "package",
    header: "Stock Bags",
  },
  
]