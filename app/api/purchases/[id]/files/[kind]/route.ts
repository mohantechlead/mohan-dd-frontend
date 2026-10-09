import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const ALLOWED_KINDS = new Set(["ecd", "transit_permit"]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; kind: string }> }
) {
  const { id, kind } = await context.params;
  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ detail: "Unknown file kind." }, { status: 404 });
  }

  const endpoint = `${DJANGO_API_ENDPOINT}/inventory/purchases/${encodeURIComponent(id)}/files/${encodeURIComponent(kind)}`;
  const token = await getToken();

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Cannot reach API server. Is the Django backend running?" },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    let payload: unknown = { detail: "File not found." };
    try {
      payload = text ? JSON.parse(text) : payload;
    } catch {
      // keep default payload
    }
    return NextResponse.json(payload, { status: upstream.status });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("Content-Disposition", disposition);
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
