import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentNumber: string }> }
) {
  const { paymentNumber } = await params;
  const body = await request.json();
  const url = `${DJANGO_API_ENDPOINT}/accounting/warehouse-storage-payments/${paymentNumber}/update-status`;
  const { data, status } = await ApiProxy.post(url, body, true);
  return NextResponse.json(data, { status });
}
