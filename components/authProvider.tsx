"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types for AuthContext
interface AuthContextType {
    isAuthenticated: boolean;
    login: (username: string | undefined, redirectPath?: string, role?: string, userId?: number) => void | Promise<void>;
    logout: () => void;
    loginRequiredRedirect: () => void;
    username: string;
    role: string;
    userId: number | null;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LOGIN_REDIRECT_URL = "/"
const LOGOUT_REDIRECT_URL = "/login"
const LOGIN_REQUIRED_URL = "/login"
const LOCAL_STORAGE_KEY = "is-logged-in"
const LOCAL_USERNAME_KEY = "username"
const LOCAL_ROLE_KEY = "role"
const LOCAL_USER_ID_KEY = "userId"

interface AuthProviderProps {
    children: ReactNode;
}

function getInitialAuth() {
    if (typeof window === "undefined") return { isAuthenticated: false, username: "", role: "viewer", userId: null as number | null };
    const isAuthenticated = localStorage.getItem(LOCAL_STORAGE_KEY) === "1";
    const username = localStorage.getItem(LOCAL_USERNAME_KEY) || "";
    const roleRaw = localStorage.getItem(LOCAL_ROLE_KEY);
    const role = roleRaw ? String(roleRaw).toLowerCase() : "viewer";
    const userIdRaw = localStorage.getItem(LOCAL_USER_ID_KEY);
    const userId = userIdRaw ? parseInt(userIdRaw, 10) : null;
    return { isAuthenticated, username, role, userId: Number.isNaN(userId) ? null : userId };
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [authState, setAuthState] = useState(getInitialAuth);
    const { isAuthenticated, username, role, userId } = authState;
    const setRole = (r: string) => setAuthState((prev) => ({ ...prev, role: r }));
    const setIsAuthenticated = (v: boolean) => setAuthState((prev) => ({ ...prev, isAuthenticated: v }));
    const setUsername = (u: string) => setAuthState((prev) => ({ ...prev, username: u }));
    const setUserId = (id: number | null) => setAuthState((prev) => ({ ...prev, userId: id }));
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const storedAuthStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedAuthStatus) {
            const storedAuthStatusInt = parseInt(storedAuthStatus);
            setIsAuthenticated(storedAuthStatusInt === 1);
        }
        const storedUn = localStorage.getItem(LOCAL_USERNAME_KEY);
        if (storedUn) {
            setUsername(storedUn);
        }
        const storedRole = localStorage.getItem(LOCAL_ROLE_KEY);
        if (storedRole) {
            setRole(String(storedRole).toLowerCase());
        }
        // Fetch /me to get role and userId when authenticated (e.g. page refresh)
        if (storedAuthStatus && parseInt(storedAuthStatus) === 1) {
            fetch("/api/me", { credentials: "include" })
                .then((res) => res.ok ? res.json() : null)
                .then((data) => {
                    if (data?.role) {
                        const r = String(data.role).toLowerCase();
                        setRole(r);
                        localStorage.setItem(LOCAL_ROLE_KEY, r);
                    }
                    if (data?.id != null) {
                        const id = Number(data.id);
                        if (!Number.isNaN(id)) {
                            setUserId(id);
                            localStorage.setItem(LOCAL_USER_ID_KEY, String(id));
                        }
                    }
                })
                .catch(() => {});
        }
    }, []);

    const login = async (username: string | undefined, redirectPath?: string, roleFromServer?: string, userIdFromServer?: number) => {
        setIsAuthenticated(true);
        localStorage.setItem(LOCAL_STORAGE_KEY, "1");
        if (username) {
            localStorage.setItem(LOCAL_USERNAME_KEY, username);
            setUsername(username);
        } else {
            localStorage.removeItem(LOCAL_USERNAME_KEY);
        }
        if (userIdFromServer != null) {
            setUserId(userIdFromServer);
            localStorage.setItem(LOCAL_USER_ID_KEY, String(userIdFromServer));
        }
        // Use role from login response (fetched server-side) so admin menu shows immediately
        if (roleFromServer != null && roleFromServer !== "") {
            const r = String(roleFromServer).toLowerCase();
            setRole(r);
            localStorage.setItem(LOCAL_ROLE_KEY, r);
        } else {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                const data = res.ok ? await res.json() : null;
                if (data?.role) {
                    const r = String(data.role).toLowerCase();
                    setRole(r);
                    localStorage.setItem(LOCAL_ROLE_KEY, r);
                }
                if (data?.id != null) {
                    const id = Number(data.id);
                    if (!Number.isNaN(id)) {
                        setUserId(id);
                        localStorage.setItem(LOCAL_USER_ID_KEY, String(id));
                    }
                }
            } catch (_) {}
        }

        const nextUrl = searchParams.get("next");
        const invalidNextUrl = ['/login', '/logout'];
        const nextUrlValid = nextUrl && nextUrl.startsWith("/") && !invalidNextUrl.includes(nextUrl);

        if (nextUrlValid) {
            router.replace(nextUrl);
        } else if (redirectPath && redirectPath.startsWith("/") && !invalidNextUrl.includes(redirectPath)) {
            router.replace(redirectPath);
        } else {
            router.replace(LOGIN_REDIRECT_URL);
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setRole("viewer");
        setUserId(null);
        localStorage.setItem(LOCAL_STORAGE_KEY, "0");
        localStorage.removeItem(LOCAL_ROLE_KEY);
        localStorage.removeItem(LOCAL_USER_ID_KEY);
        router.replace(LOGOUT_REDIRECT_URL);
    };

    const loginRequiredRedirect = () => {
        // user is not logged in via API
        setIsAuthenticated(false);
        localStorage.setItem(LOCAL_STORAGE_KEY, "0");
        let loginWithNextUrl = `${LOGIN_REQUIRED_URL}?next=${pathname}`;
        if (LOGIN_REQUIRED_URL === pathname) {
            loginWithNextUrl = `${LOGIN_REQUIRED_URL}`;
        }
        router.replace(loginWithNextUrl);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loginRequiredRedirect, username, role, userId, isAdmin: (role || "").toLowerCase() === "admin" }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
