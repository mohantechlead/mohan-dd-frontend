import { NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_AI_CONTEXT = `${DJANGO_API_ENDPOINT}/ai/context`;

export async function GET() {
  const { data, status } = await ApiProxy.get(DJANGO_API_AI_CONTEXT, true);
  return NextResponse.json(data, { status });
}
