import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const APPROVALS_URL = `${DJANGO_API_ENDPOINT}/inventory/warehouse-settings-approvals`;

export async function GET(request: NextRequest) {
  const { searchParams } = new globalThis.URL(request.url);
  const qs = searchParams.toString();
  const { data, status } = await ApiProxy.get(qs ? `${APPROVALS_URL}?${qs}` : APPROVALS_URL, true);
  return NextResponse.json(data, { status });
}
