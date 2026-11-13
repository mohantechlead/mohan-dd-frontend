import { cookies } from "next/headers";
import { DJANGO_API_ENDPOINT } from "@/config/defaults";

// Users stay signed in until they explicitly log out, so the cookies must
// outlive the browser session (10 years).
const TOKEN_AGE = 60 * 60 * 24 * 365 * 10;
const TOKEN_NAME = "auth-token";
const TOKEN_REFRESH_NAME = "auth-refresh-token";

function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { exp?: unknown };
    if (typeof claims.exp !== "number") return true;
    // Treat tokens that expire within the next minute as already expired so a
    // long request cannot race the refresh.
    return claims.exp * 1000 <= Date.now() + 60_000;
  } catch {
    return true;
  }
}

async function refreshAccessToken(
  refreshToken: string
): Promise<string | null> {
  try {
    const res = await fetch(`${DJANGO_API_ENDPOINT}/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access?: unknown };
    return typeof data.access === "string" ? data.access : null;
  } catch {
    return null;
  }
}

export async function getToken() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(TOKEN_NAME)?.value;

  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  const refreshToken = cookieStore.get(TOKEN_REFRESH_NAME)?.value;
  if (!refreshToken) return accessToken;

  const refreshed = await refreshAccessToken(refreshToken);
  if (!refreshed) return accessToken;

  try {
    await setToken(refreshed);
  } catch {
    // Cookies cannot be written in every rendering context; the request still
    // succeeds with the freshly minted token.
  }
  return refreshed;
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_REFRESH_NAME)?.value;
}

export async function setToken(authToken: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: TOKEN_NAME,
    value: authToken,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    maxAge: TOKEN_AGE,
  });
}

export async function setRefreshToken(authRefreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: TOKEN_REFRESH_NAME,
    value: authRefreshToken,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    maxAge: TOKEN_AGE,
  });
}

export async function deleteTokens() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_REFRESH_NAME);
  cookieStore.delete(TOKEN_NAME);
}