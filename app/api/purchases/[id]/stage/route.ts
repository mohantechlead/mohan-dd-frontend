import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const endpoint = `${DJANGO_API_ENDPOINT}/inventory/purchases/${encodeURIComponent(id)}/stage`;
  const token = await getToken();

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("multipart/form-data");
  const body = isForm ? await request.formData() : await request.json();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  let data: unknown;
  let status = 500;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: isForm ? (body as FormData) : JSON.stringify(body),
    });
    const text = await response.text();
    status = response.status;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: "Invalid JSON response from server" };
    }
  } catch {
    data = { detail: "Cannot reach API server. Is the Django backend running?" };
    status = 502;
  }
  return NextResponse.json(data, { status });
}
