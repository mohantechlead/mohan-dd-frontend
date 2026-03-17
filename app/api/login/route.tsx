"use server"
import { DJANGO_API_ENDPOINT } from '@/config/defaults'
import { setRefreshToken, setToken } from '@/lib/auth'
import { NextResponse } from 'next/server'

const DJANGO_API_LOGIN_URL = `${DJANGO_API_ENDPOINT}/token/pair`
const DJANGO_ME_URL = `${DJANGO_API_ENDPOINT}/me`

export async function POST(request: any) {
    const requestData = await request.json()
    const jsonData = JSON.stringify(requestData)
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonData,
    }
    const response = await fetch(DJANGO_API_LOGIN_URL, requestOptions)
    const responseData = await response.json()
    if (response.ok) {
        const { username, access, refresh } = responseData
        setToken(access)
        setRefreshToken(refresh)
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
    return NextResponse.json({ loggedIn: false, ...responseData }, { status: 400 })
}   