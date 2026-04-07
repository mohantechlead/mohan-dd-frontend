import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestData = await request.json();
  const endpoint = `${DJANGO_API_ENDPOINT}/accounting/expense-payments/${encodeURIComponent(id)}/approve`;
  const { data, status } = await ApiProxy.post(endpoint, requestData, true);
  return NextResponse.json(data, { status });
}
