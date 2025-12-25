import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "../../proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJAGNO_API_CUSTOMER = `${DJANGO_API_ENDPOINT}/partners/customer`;

export async function GET() {
  const { data, status } = await ApiProxy.get(DJAGNO_API_CUSTOMER, true);
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const requestData = await request.json();
  const { data, status } = await ApiProxy.post(
    DJAGNO_API_CUSTOMER,
    requestData,
    true
  );
  return NextResponse.json(data, { status });
}
