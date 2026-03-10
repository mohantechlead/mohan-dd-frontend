import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_SHIPPING_INVOICES = `${DJANGO_API_ENDPOINT}/inventory/shipping-invoices`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("order_number");
  const endpoint = orderNumber
    ? `${DJANGO_API_SHIPPING_INVOICES}?order_number=${encodeURIComponent(
        orderNumber
      )}`
    : DJANGO_API_SHIPPING_INVOICES;

  const { data, status } = await ApiProxy.get(endpoint, true);
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const requestData = await request.json();
  const { data, status } = await ApiProxy.post(
    DJANGO_API_SHIPPING_INVOICES,
    requestData,
    true
  );
  return NextResponse.json(data, { status });
}

