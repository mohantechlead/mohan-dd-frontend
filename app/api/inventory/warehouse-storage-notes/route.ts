import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_WSN = `${DJANGO_API_ENDPOINT}/inventory/warehouse-storage-notes`;

export async function GET(_request: NextRequest) {
  const { data, status } = await ApiProxy.get(DJANGO_API_WSN, true);
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const requestData = await request.json();
  const { data, status } = await ApiProxy.post(DJANGO_API_WSN, requestData, true);
  return NextResponse.json(data, { status });
}
