"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";
import { readToken, writeToken } from "./storage";

export type AuthUser = {
  id: number;
  email?: string;
  name?: string;
  avatar_url?: string | null;
  role?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setTokenFromOAuthCallback: (token: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthTokenResponse = { user: AuthUser; token: string };
type LoginRequest = { email: string; password: string };
type RegisterRequest = { email: string; password: string; name?: string };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = readToken();
    setToken(t);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    writeToken(token);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const body: LoginRequest = { email, password };
    const res = await apiFetch<AuthTokenResponse>("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const body: RegisterRequest = { email, password, ...(name ? { name } : null) };
    const res = await apiFetch<AuthTokenResponse>("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const setTokenFromOAuthCallback = useCallback((t: string) => {
    setToken(t);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      login,
      register,
      logout,
      setTokenFromOAuthCallback,
    }),
    [token, user, isLoading, login, register, logout, setTokenFromOAuthCallback]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

