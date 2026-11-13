import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const base = (id: string) =>
  `${DJANGO_API_ENDPOINT}/inventory/purchases/${encodeURIComponent(id)}/bl/check-status`;

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { data, status } = await ApiProxy.post(base(id), {}, true);
  return NextResponse.json(data, { status });
}
