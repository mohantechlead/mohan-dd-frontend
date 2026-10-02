import { NextRequest, NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

const DJANGO_API_AI_CHAT = `${DJANGO_API_ENDPOINT}/ai/chat`;

export async function POST(request: NextRequest) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as { message?: unknown; conversation_id?: unknown };
  if (typeof payload.message !== "string" || !payload.message.trim()) {
    return NextResponse.json(
      { detail: "message is required." },
      { status: 400 }
    );
  }

  const { data, status } = await ApiProxy.post(
    DJANGO_API_AI_CHAT,
    {
      message: payload.message.trim(),
      ...(typeof payload.conversation_id === "string" &&
      payload.conversation_id.trim()
        ? { conversation_id: payload.conversation_id.trim() }
        : {}),
    },
    true
  );
  return NextResponse.json(data, { status });
}
