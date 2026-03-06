"use client";
import { ReactNode } from "react";
import { C } from "@/lib/tokens";
import { useAuth } from "./AuthProvider";

interface NavItem { key: string; icon: string; label: string; badge?: number; }

interface ShellProps {
  nav: NavItem[];
  page: string;
  setPage: (p: string) => void;
  children: ReactNode;
  sidebarBottom?: ReactNode;
}

export function Shell({ nav, page, setPage, children, sidebarBottom }: ShellProps) {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.pageBg }}>
      {/* ── Sidebar ── */}
      <div style={{ width: 232, background: C.sidebarBg, borderRight: `1.5px solid ${C.cardBorder}`, display: "flex", flexDirection: "column", padding: "0 0 20px", flexShrink: 0, position: "sticky", top: 0, height: "100vh", boxShadow: "2px 0 14px rgba(100,75,50,0.06)", overflowY: "auto" }}>

        {/* Logo */}
        <div style={{ padding: "22px 20px 18px", borderBottom: `1.5px solid ${C.cardBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, boxShadow: `0 4px 12px ${C.primary}45`, flexShrink: 0 }}>📚</div>
            <div>
              <div style={{ color: C.text, fontWeight: 800, fontSize: 15, fontFamily: "'Lora',serif" }}>LibraryOS</div>
              <div style={{ color: C.textLight, fontSize: 9, letterSpacing: 0.6, textTransform: "uppercase" }}>{user?.role === "admin" ? "Admin Portal" : "Student Portal"}</div>
            </div>
          </div>
        </div>

        {/* User chip */}
        <div style={{ padding: "14px 14px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: user?.role === "admin" ? C.primaryBg : C.greenBg, borderRadius: 12, border: `1px solid ${user?.role === "admin" ? C.primary : C.green}22` }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: user?.role === "admin" ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : `linear-gradient(135deg,${C.green},#3a9068)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {user?.role === "admin" ? "AD" : user?.avatar ?? "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.text, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
              <div style={{ color: user?.role === "admin" ? C.primaryDark : C.green, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{user?.role === "admin" ? "Administrator" : user?.department}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map(n => (
            <button key={n.key} onClick={() => setPage(n.key)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderRadius: 11, border: "none", background: page === n.key ? C.primaryBg : "transparent", color: page === n.key ? C.primaryDark : C.textMid, cursor: "pointer", fontSize: 13, fontWeight: page === n.key ? 700 : 500, fontFamily: "inherit", transition: "all 0.15s", borderLeft: `3px solid ${page === n.key ? C.primary : "transparent"}`, textAlign: "left", width: "100%" }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {(n.badge ?? 0) > 0 && (
                <span style={{ background: C.red, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{n.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Sidebar bottom slot */}
        {sidebarBottom}

        {/* Logout */}
        <div style={{ padding: "8px 12px 0" }}>
          <button onClick={logout}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", width: "100%", borderRadius: 11, border: `1.5px solid ${C.inputBorder}`, background: C.inputBg, color: C.textMid, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 36, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
