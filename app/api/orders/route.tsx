import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "../proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_ORDERS = `${DJANGO_API_ENDPOINT}/inventory/orders`;

export async function GET(request: NextRequest) {
  const { data, status } = await ApiProxy.get(DJANGO_API_ORDERS, true);
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const requestData = await request.json();
  const { data, status } = await ApiProxy.post(
    DJANGO_API_ORDERS,
    requestData,
    true
  );
  return NextResponse.json(data, { status });
}

