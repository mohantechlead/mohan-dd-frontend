import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const URL = `${DJANGO_API_ENDPOINT}/inventory/warehouse-item-inventory`;

export async function GET(_request: NextRequest) {
  const { data, status } = await ApiProxy.get(URL, true);
  return NextResponse.json(data, { status });
}
