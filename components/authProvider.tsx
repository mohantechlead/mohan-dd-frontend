"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types for AuthContext
interface AuthContextType {
    isAuthenticated: boolean;
    login: (username: string | undefined) => void;
    logout: () => void;
    loginRequiredRedirect: () => void;
    username: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LOGIN_REDIRECT_URL = "/"
const LOGOUT_REDIRECT_URL = "/login"
const LOGIN_REQUIRED_URL = "/login"
const LOCAL_STORAGE_KEY = "is-logged-in"
const LOCAL_USERNAME_KEY = "username"

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [username, setUsername] = useState<string>("");
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
    }, []);

    const login = (username: string | undefined) => {
        setIsAuthenticated(true);
        localStorage.setItem(LOCAL_STORAGE_KEY, "1");
        if (username) {
            localStorage.setItem(LOCAL_USERNAME_KEY, username);
            setUsername(username);
        } else {
            localStorage.removeItem(LOCAL_USERNAME_KEY);
        }

        const nextUrl = searchParams.get("next");
        const invalidNextUrl = ['/login', '/logout'];
        const nextUrlValid = nextUrl && nextUrl.startsWith("/") && !invalidNextUrl.includes(nextUrl);

        if (nextUrlValid) {
            router.replace(nextUrl);
        } else {
            router.replace(LOGIN_REDIRECT_URL);
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        localStorage.setItem(LOCAL_STORAGE_KEY, "0");
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
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loginRequiredRedirect, username }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
