import { cookies } from "next/headers";

const TOKEN_AGE = 3600;
const TOKEN_NAME = "auth-token";
const TOKEN_REFRESH_NAME = "auth-refresh-token";

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
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
