import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_EXPIRY = `${DJANGO_API_ENDPOINT}/inventory/warehouse-expiry-check`;

export async function GET(request: NextRequest) {
  const { data, status } = await ApiProxy.get(DJANGO_API_EXPIRY, true);
  return NextResponse.json(data, { status });
}
