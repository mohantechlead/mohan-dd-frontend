import { DJANGO_API_ENDPOINT } from "@/config/defaults";
import { setRefreshToken, setToken } from "@/lib/auth";
import { NextResponse } from "next/server";

const DJANGO_API_LOGIN_URL = `${DJANGO_API_ENDPOINT}/token/pair`;
const DJANGO_ME_URL = `${DJANGO_API_ENDPOINT}/me`;

export async function POST(request: Request) {
    const requestData = await request.json()
    const jsonData = JSON.stringify(requestData)
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonData,
    }
    const response = await fetch(DJANGO_API_LOGIN_URL, requestOptions)
    const text = await response.text()
    let responseData: Record<string, unknown> = {}
    try {
        responseData = text ? JSON.parse(text) : {}
    } catch {
        // Backend returned HTML (e.g. 404, 500 page) instead of JSON
        return NextResponse.json(
            { loggedIn: false, detail: "Unable to reach server. Please try again later." },
            { status: 502 }
        )
    }
    if (response.ok) {
        const { username, access, refresh } = responseData as {
            access?: string
            refresh?: string
            username?: string
        }
        if (typeof access === "string" && typeof refresh === "string") {
            await setToken(access);
            await setRefreshToken(refresh);
            // Fetch user id and role server-side so client gets them without relying on cookie in same tick
            let role: string | undefined
            let userId: number | undefined
            try {
                const meRes = await fetch(DJANGO_ME_URL, {
                    headers: { Authorization: `Bearer ${access}`, Accept: "application/json" },
                })
                if (meRes.ok) {
                    const meData = await meRes.json()
                    role = meData?.role
                    userId = meData?.id != null ? Number(meData.id) : undefined
                }
            } catch (_) {}
            return NextResponse.json(
                { loggedIn: true, username, role: role ?? "logistics", userId },
                { status: 200 }
            )
        }
        return NextResponse.json(
            { loggedIn: false, detail: "Invalid server response. Missing tokens." },
            { status: 502 }
        )
    }
    return NextResponse.json({ loggedIn: false, ...responseData }, { status: 400 });
}