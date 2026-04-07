import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const BASE_URL = `${DJANGO_API_ENDPOINT}/accounting/received-payments`;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { data, status } = await ApiProxy.get(`${BASE_URL}/${encodeURIComponent(id)}`, true);
  return NextResponse.json(data, { status });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const { data, status } = await ApiProxy.put(`${BASE_URL}/${encodeURIComponent(id)}`, body, true);
  return NextResponse.json(data, { status });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { data, status } = await ApiProxy.delete(`${BASE_URL}/${encodeURIComponent(id)}`, true);
  return NextResponse.json(data, { status });
}
