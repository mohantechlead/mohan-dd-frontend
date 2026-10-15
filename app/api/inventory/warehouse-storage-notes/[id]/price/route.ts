import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const URL = `${DJANGO_API_ENDPOINT}/inventory/warehouse-storage-notes/${id}/price`;
  const { data, status } = await ApiProxy.put(URL, body, true);
  return NextResponse.json(data, { status });
}
