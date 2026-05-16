"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";

export type AuthUser = {
  id: number;
  email?: string;
  name?: string;
  avatar_url?: string | null;
  role?: string;
  vendor_status?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthTokenResponse = { user: AuthUser; token: string };
type LoginRequest = { email: string; password: string };
type RegisterRequest = { email: string; password: string; name?: string };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to rehydrate user from the HttpOnly cookie via /api/auth/me
  const refreshUser = useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>("/api/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const body: LoginRequest = { email, password };
    const res = await apiFetch<AuthTokenResponse>("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const body: RegisterRequest = { email, password, ...(name ? { name } : null) };
    const res = await apiFetch<AuthTokenResponse>("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — we clear local state regardless
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
