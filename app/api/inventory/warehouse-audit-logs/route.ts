import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storage_note_id = searchParams.get("storage_note_id") || "";
    const limit = searchParams.get("limit") || "50";
    const url = new URL(`${BACKEND}/api/inventory/warehouse-audit-logs`);
    if (storage_note_id) url.searchParams.set("storage_note_id", storage_note_id);
    url.searchParams.set("limit", limit);

    const res = await fetch(url.toString(), {
      headers: { Authorization: req.headers.get("authorization") || "" },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to fetch audit logs" },
      { status: 502 }
    );
  }
}
