import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_USERS = `${DJANGO_API_ENDPOINT}/partners/users`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { data, status } = await ApiProxy.post(
    `${DJANGO_API_USERS}/${id}/change-password`,
    body,
    true
  );
  return NextResponse.json(data, { status });
}
