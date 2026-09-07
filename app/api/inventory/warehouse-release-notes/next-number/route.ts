import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_WRN = `${DJANGO_API_ENDPOINT}/inventory/warehouse-release-notes`;

export async function GET(request: NextRequest) {
  const { data, status } = await ApiProxy.get(`${DJANGO_API_WRN}/next-number`, false);
  return NextResponse.json(data, { status });
}
