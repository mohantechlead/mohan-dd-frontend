import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "../../proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const URL = `${DJANGO_API_ENDPOINT}/accounting/vendor-payments`;

export async function GET(_request: NextRequest) {
  const { data, status } = await ApiProxy.get(URL, true);
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const requestData = await request.json();
  const { data, status } = await ApiProxy.post(URL, requestData, true);
  return NextResponse.json(data, { status });
}
