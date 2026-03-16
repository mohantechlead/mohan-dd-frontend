import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_ORDERS = `${DJANGO_API_ENDPOINT}/inventory/orders`;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const endpoint = `${DJANGO_API_ORDERS}/${id}`;
  const { data, status } = await ApiProxy.get(endpoint, true);
  return NextResponse.json(data, { status });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const endpoint = `${DJANGO_API_ORDERS}/${encodeURIComponent(id)}`;
  const { data, status } = await ApiProxy.put(endpoint, body, true);
  return NextResponse.json(data, { status });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const endpoint = `${DJANGO_API_ORDERS}/${encodeURIComponent(id)}`;
  const { data, status } = await ApiProxy.delete(endpoint, true);
  return NextResponse.json(data, { status });
}

