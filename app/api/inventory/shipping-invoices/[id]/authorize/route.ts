import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_SHIPPING_INVOICES = `${DJANGO_API_ENDPOINT}/inventory/shipping-invoices`;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const endpoint = `${DJANGO_API_SHIPPING_INVOICES}/${id}/authorize`;
  const { data, status } = await ApiProxy.post(endpoint, {}, true);
  return NextResponse.json(data, { status });
}
