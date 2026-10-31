import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const ADJUSTMENTS_URL = `${DJANGO_API_ENDPOINT}/inventory/stock/adjustments`;

export async function GET(request: NextRequest) {
  const { searchParams } = new globalThis.URL(request.url);
  const qs = searchParams.toString();
  const { data, status } = await ApiProxy.get(
    qs ? `${ADJUSTMENTS_URL}?${qs}` : ADJUSTMENTS_URL,
    true
  );
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const requestData = await request.json();
  const { data, status } = await ApiProxy.post(
    ADJUSTMENTS_URL,
    requestData,
    true
  );
  return NextResponse.json(data, { status });
}
