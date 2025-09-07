"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type User = { name: string; email: string } | null;

type AuthContextValue = {
  user: User;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("corexia:user");
      const rawTok = localStorage.getItem("corexia:token");
      if (rawUser) setUser(JSON.parse(rawUser));
      if (rawTok) setToken(rawTok);
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (user) localStorage.setItem("corexia:user", JSON.stringify(user));
    else localStorage.removeItem("corexia:user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("corexia:token", token);
    else localStorage.removeItem("corexia:token");
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = await res.json();
    const tok = String(json.token || "");
    const usr = json.user as { name: string; email: string };
    if (!tok || !usr?.email) throw new Error("invalid response");
    setToken(tok);
    setUser({ name: usr.name, email: usr.email });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(() => ({ user, token, login, logout }), [user, token, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

