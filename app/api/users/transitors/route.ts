import { NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

export async function GET() {
  const endpoint = `${DJANGO_API_ENDPOINT}/partners/users/transitors`;
  const { data, status } = await ApiProxy.get(endpoint, true);
  return NextResponse.json(data, { status });
}
