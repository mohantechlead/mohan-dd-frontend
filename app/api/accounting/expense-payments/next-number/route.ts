import { NextResponse } from "next/server";
import ApiProxy from "../../../proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const URL = `${DJANGO_API_ENDPOINT}/accounting/expense-payments/next-number`;

export async function GET() {
  const { data, status } = await ApiProxy.get(URL, true);
  return NextResponse.json(data, { status });
}
