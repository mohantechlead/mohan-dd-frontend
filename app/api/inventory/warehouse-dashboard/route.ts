import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND}/api/inventory/warehouse-dashboard`, {
      headers: { Authorization: req.headers.get("authorization") || "" },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to fetch warehouse dashboard" },
      { status: 502 }
    );
  }
}
