"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiMe, apiLogout } from "@/lib/client";

interface User {
  userId: number; email: string; role: "admin" | "student";
  name: string; studentId?: number; studentCode?: string;
  avatar?: string; department?: string; status?: string;
}

interface AuthCtx { user: User | null; loading: boolean; refresh: () => void; logout: () => Promise<void>; }
const Ctx = createContext<AuthCtx>({ user: null, loading: true, refresh: () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { const d = await apiMe(); setUser(d.user); } catch { setUser(null); } finally { setLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout(); setUser(null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <Ctx.Provider value={{ user, loading, refresh, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
