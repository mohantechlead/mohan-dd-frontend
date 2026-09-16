import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(
  req: NextRequest,
  { params }: { params: { paymentNumber: string } }
) {
  try {
    const body = await req.json();
    const res = await fetch(
      `${BACKEND}/api/accounting/warehouse-storage-payments/${params.paymentNumber}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("authorization") || "",
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to approve payment" },
      { status: 502 }
    );
  }
}
