import { NextResponse } from "next/server";
import ApiProxy from "@/app/api/proxy";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

async function getUserRole() {
  const { data, status } = await ApiProxy.get(`${DJANGO_API_ENDPOINT}/me`, true);
  const role = String((data as { role?: string })?.role ?? "").toLowerCase();
  return { role, status };
}

export async function requireAdminResponse(): Promise<NextResponse | null> {
  const { role, status } = await getUserRole();

  if (status !== 200) {
    return NextResponse.json(
      { detail: "Authentication required." },
      { status: status === 401 ? 401 : 403 }
    );
  }

  if (role !== "admin") {
    return NextResponse.json(
      { detail: "Only admin can edit or delete GRN/DN records." },
      { status: 403 }
    );
  }

  return null;
}
