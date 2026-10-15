import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_WSP = `${DJANGO_API_ENDPOINT}/accounting/warehouse-storage-payments`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentNumber: string }> }
) {
  const { paymentNumber } = await params;
  const { data, status } = await ApiProxy.get(
    `${DJANGO_API_WSP}/${encodeURIComponent(paymentNumber)}`,
    true
  );
  return NextResponse.json(data, { status });
}
