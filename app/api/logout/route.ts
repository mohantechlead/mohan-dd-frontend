import { deleteTokens } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  await deleteTokens();
  return NextResponse.json({ loggedOut: true }, { status: 200 });
}