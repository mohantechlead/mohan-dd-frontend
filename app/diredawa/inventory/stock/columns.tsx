"use client"

import { ColumnDef } from "@tanstack/react-table"

export type Items = {
  item_name: string
  code?: string
  quantity: string
  package: string
  grn_nos?: string[]
  dn_nos?: string[]
}

export const columns: ColumnDef<Items>[] = [
{
        accessorKey: "item_name",
        header: "Item Name",
      },
  
      {
        accessorKey: "code",
        header: "Code",
      },
  {
    accessorKey: "quantity",
    header: "Stock Quantity",
  },
 
  {
    accessorKey: "package",
    header: "Stock Bags",
  },
  {
    accessorKey: "grn_nos",
    header: "GRN Nos",
    cell: ({ row }) => (row.original.grn_nos?.length ? row.original.grn_nos.join(", ") : "-"),
  },
  {
    accessorKey: "dn_nos",
    header: "DN Nos",
    cell: ({ row }) => (row.original.dn_nos?.length ? row.original.dn_nos.join(", ") : "-"),
  },
  
]