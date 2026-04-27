"use client";
import { ReactNode, useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (key: string) => {
    setPage(key);
    setMobileOpen(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.pageBg }}>
      <style>{`
        @media (max-width: 768px) {
          .shell-sidebar { transform: translateX(-100%); position: fixed !important; z-index: 1000; transition: transform 0.27s cubic-bezier(.4,0,.2,1) !important; }
          .shell-sidebar.open { transform: translateX(0) !important; }
          .shell-hamburger { display: flex !important; }
          .shell-search { display: none !important; }
          .shell-user-name { display: none !important; }
          .shell-content-pad { padding: 16px !important; }
          .shell-header { padding: 12px 16px !important; }
        }
        @media (min-width: 769px) {
          .shell-sidebar { transform: translateX(0) !important; position: sticky !important; }
          .shell-hamburger { display: none !important; }
        }
        .shell-nav-btn:hover { background: ${C.primaryBg} !important; color: ${C.primaryDark} !important; }
      `}</style>

      {/* Mobile overlay backdrop — only rendered when sidebar is open */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 999, backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" } as any}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className={`shell-sidebar${mobileOpen ? " open" : ""}`}
        style={{ width: 232, background: C.sidebarBg, borderRight: `1.5px solid ${C.cardBorder}`, display: "flex", flexDirection: "column", padding: "0 0 20px", flexShrink: 0, top: 0, height: "100vh", boxShadow: "2px 0 14px rgba(100,75,50,0.06)", overflowY: "auto", transition: "transform 0.27s cubic-bezier(.4,0,.2,1)" }}
      >
        {/* Logo */}
        <div style={{ padding: "26px 20px 20px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, boxShadow: `0 4px 12px ${C.primary}45`, flexShrink: 0 }}>📚</div>
            <div>
              <div style={{ color: C.text, fontWeight: 800, fontSize: 16, fontFamily: "'Lora',serif" }}>LibraryOS</div>
              <div style={{ color: C.textLight, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase" }}>{user?.role === "admin" ? "Admin Portal" : "Student Portal"}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {nav.map(n => (
            <button key={n.key} onClick={() => navigate(n.key)}
              className="shell-nav-btn"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: "none", background: page === n.key ? C.primaryBg : "transparent", color: page === n.key ? C.primaryDark : C.textMid, cursor: "pointer", fontSize: 13, fontWeight: page === n.key ? 700 : 500, fontFamily: "inherit", transition: "all 0.15s", borderLeft: `3px solid ${page === n.key ? C.primary : "transparent"}`, textAlign: "left", width: "100%" }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {(n.badge ?? 0) > 0 && (
                <span style={{ background: C.red, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{n.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Sidebar bottom slot */}
        <div style={{ marginTop: "auto" }}>
          {sidebarBottom}
        </div>

        {/* Mobile: logout row at bottom of sidebar */}
        <div style={{ padding: "10px 16px 0" }}>
          <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: "none", background: "transparent", color: C.textMid, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh" }}>

        {/* Top Header Bar */}
        <div className="shell-header" style={{ background: C.cardBg, borderBottom: `1.5px solid ${C.cardBorder}`, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 10px rgba(100,75,50,0.02)", gap: 12 }}>

          {/* Hamburger (mobile only) */}
          <button
            className="shell-hamburger"
            onClick={() => setMobileOpen(o => !o)}
            style={{ display: "none", flexDirection: "column", gap: 5, background: "transparent", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
          >
            <span style={{ width: 22, height: 2, background: C.text, borderRadius: 2, display: "block" }} />
            <span style={{ width: 22, height: 2, background: C.text, borderRadius: 2, display: "block" }} />
            <span style={{ width: 22, height: 2, background: C.text, borderRadius: 2, display: "block" }} />
          </button>

          {/* Logo label (mobile) */}
          <div className="shell-hamburger" style={{ display: "none", color: C.text, fontWeight: 800, fontSize: 15, fontFamily: "'Lora',serif" }}>LibraryOS</div>

          {/* Search (hidden on mobile) */}
          <div className="shell-search" style={{ display: "flex", alignItems: "center", gap: 12, background: C.inputBg, padding: "9px 16px", borderRadius: 24, flex: 1, maxWidth: 340, border: `1.5px solid ${C.inputBorder}` }}>
            <span style={{ fontSize: 13, color: C.textLight }}>🔍</span>
            <input placeholder={user?.role === "admin" ? "Search books, members..." : "Search books, authors..."} style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%", color: C.text, fontFamily: "inherit" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <div style={{ position: "absolute", top: -2, right: -3, background: C.red, width: 7, height: 7, borderRadius: "50%", border: "2px solid #fff" }} />
            </div>

            <div style={{ height: 30, width: 1.5, background: C.cardBorder }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="shell-user-name" style={{ textAlign: "right" }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{user?.name}</div>
                <div style={{ color: user?.role === "admin" ? C.primaryDark : C.textLight, fontSize: 11, fontWeight: 600 }}>{user?.role === "admin" ? "Librarian" : user?.department}</div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: user?.role === "admin" ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : `linear-gradient(135deg,${C.green},#3a9068)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {user?.role === "admin" ? "AD" : user?.avatar ?? "?"}
              </div>
              <button onClick={logout} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, padding: 4, opacity: 0.7, transition: "opacity 0.2s", display: "none" }} className="shell-search" title="Sign Out">🚪</button>
            </div>
          </div>
        </div>

        {/* Scrollable Page Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div className="shell-content-pad" style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
