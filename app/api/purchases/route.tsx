import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "../proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_PURCHASES = `${DJANGO_API_ENDPOINT}/inventory/purchases`;

export async function GET(request: NextRequest) {
  const { data, status } = await ApiProxy.get(DJANGO_API_PURCHASES, true);
  return NextResponse.json(data, { status });
}

export async function POST(request: NextRequest) {
  const requestData = await request.json();
  const { data, status } = await ApiProxy.post(
    DJANGO_API_PURCHASES,
    requestData,
    true
  );
  return NextResponse.json(data, { status });
}

