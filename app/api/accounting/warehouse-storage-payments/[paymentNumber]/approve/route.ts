import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "../../../proxy";

const DJANGO_API_ENDPOINT = process.env.DJANGO_API_ENDPOINT || "http://localhost:8000/api";

export async function POST(
  req: NextRequest,
  { params }: { params: { paymentNumber: string } }
) {
  try {
    const body = await req.json();
    const url = `${DJANGO_API_ENDPOINT}/accounting/warehouse-storage-payments/${params.paymentNumber}/approve`;
    const { data, status } = await ApiProxy.post(url, body, true);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to approve payment" },
      { status: 502 }
    );
  }
}
