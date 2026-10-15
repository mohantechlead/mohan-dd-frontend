import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const URL = `${DJANGO_API_ENDPOINT}/inventory/warehouse-storage-notes/${id}/flow`;
  const { data, status } = await ApiProxy.get(URL, true);
  return NextResponse.json(data, { status });
}
