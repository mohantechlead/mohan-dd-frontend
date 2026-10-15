import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_WSN = `${DJANGO_API_ENDPOINT}/inventory/warehouse-storage-notes`;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestData = await request.json();
  const endpoint = `${DJANGO_API_WSN}/${id}/top-up`;
  const { data, status } = await ApiProxy.post(endpoint, requestData, true);
  return NextResponse.json(data, { status });
}
