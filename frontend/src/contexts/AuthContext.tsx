"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    firebase_uid: string;
    is_active: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isArtisan: boolean;
    isAdmin: boolean;
    isBuyer: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    login: () => { },
    logout: () => { },
    isArtisan: false,
    isAdmin: false,
    isBuyer: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored auth on mount
        const storedToken = localStorage.getItem("kk_token");
        const storedUser = localStorage.getItem("kk_user");
        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem("kk_token");
                localStorage.removeItem("kk_user");
            }
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem("kk_token", newToken);
        localStorage.setItem("kk_user", JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("kk_token");
        localStorage.removeItem("kk_user");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                logout,
                isArtisan: user?.role === "artisan",
                isAdmin: user?.role === "admin",
                isBuyer: user?.role === "buyer",
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
