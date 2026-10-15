import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const URL = `${DJANGO_API_ENDPOINT}/inventory/warehouse-settings-approvals/${id}/approve`;
  const { data, status } = await ApiProxy.post(URL, {}, true);
  return NextResponse.json(data, { status });
}
