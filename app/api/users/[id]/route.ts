import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_USERS = `${DJANGO_API_ENDPOINT}/partners/users`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, status } = await ApiProxy.get(
    `${DJANGO_API_USERS}/${id}`,
    true
  );
  return NextResponse.json(data, { status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { data, status } = await ApiProxy.put(
    `${DJANGO_API_USERS}/${id}`,
    body,
    true
  );
  return NextResponse.json(data, { status });
}
