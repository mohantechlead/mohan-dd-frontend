import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_WRN = `${DJANGO_API_ENDPOINT}/inventory/warehouse-release-notes`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, status } = await ApiProxy.get(`${DJANGO_API_WRN}/${id}`, false);
  return NextResponse.json(data, { status });
}
