import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wsn_no = searchParams.get("wsn_no") || "";
    const installments = searchParams.get("installments") || "3";
    const res = await fetch(
      `${BACKEND}/api/accounting/warehouse-storage-payments/plan?wsn_no=${encodeURIComponent(wsn_no)}&installments=${installments}`,
      {
        headers: { Authorization: req.headers.get("authorization") || "" },
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to fetch payment plan" },
      { status: 502 }
    );
  }
}
