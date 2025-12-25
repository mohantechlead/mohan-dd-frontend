"use client"

import { ColumnDef } from "@tanstack/react-table"

export type Supplier = {
  name: string
  email: number
  phone: string
  address: string
  partner_type: string
  tin_number: string
}

export const columns: ColumnDef<Supplier>[] = [
{
        accessorKey: "name",
        header: "Supplier Name",
      },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "partner_type",
    header: "Partner Type",
  },
  {
    accessorKey: "tin_number",
    header: "Tin Number",
  },
]