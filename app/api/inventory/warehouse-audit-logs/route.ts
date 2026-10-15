import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const AUDIT_LOGS_URL = `${DJANGO_API_ENDPOINT}/inventory/warehouse-audit-logs`;

export async function GET(request: NextRequest) {
  const { searchParams } = new globalThis.URL(request.url);
  const qs = searchParams.toString();
  const { data, status } = await ApiProxy.get(qs ? `${AUDIT_LOGS_URL}?${qs}` : AUDIT_LOGS_URL, true);
  return NextResponse.json(data, { status });
}
