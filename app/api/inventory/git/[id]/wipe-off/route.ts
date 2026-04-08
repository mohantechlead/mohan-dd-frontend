import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_GIT = `${DJANGO_API_ENDPOINT}/inventory/git`;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, status } = await ApiProxy.post(
    `${DJANGO_API_GIT}/${encodeURIComponent(id)}/wipe-off`,
    {},
    true
  );
  return NextResponse.json(data, { status });
}

