"use client"

import { ColumnDef } from "@tanstack/react-table"

export type Items = {
  item_name: string
  hscode: string
  internal_code: string
}

export const columns: ColumnDef<Items>[] = [
{
        accessorKey: "item_name",
        header: "Item Name",
      },
  {
    accessorKey: "hscode",
    header: "HS Code",
  },
 
  {
    accessorKey: "internal_code",
    header: "Internal Code",
  },
]