import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ paymentNumber: string }> }
) {
  try {
    const { paymentNumber } = await params;
    const body = await req.json();
    const url = `${DJANGO_API_ENDPOINT}/accounting/warehouse-storage-payments/${paymentNumber}/approve`;
    const { data, status } = await ApiProxy.post(url, body, true);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to approve payment" },
      { status: 502 }
    );
  }
}
