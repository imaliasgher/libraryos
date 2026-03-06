"use client";
import { useState } from "react";
import { C } from "@/lib/tokens";
import { apiLogin } from "@/lib/client";
import { useAuth } from "./AuthProvider";

export function LoginScreen() {
  const { refresh } = useAuth();
  const [tab, setTab]       = useState<"admin" | "student">("admin");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [show, setShow]     = useState(false);
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) return setErr("Please enter email and password.");
    setErr(""); setLoading(true);
    try {
      await apiLogin(email, pass);
      await refresh();
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const demoFill = (who: "admin" | "student") => {
    setTab(who);
    if (who === "admin")   { setEmail("admin@library.edu"); setPass("admin123"); }
    else                   { setEmail("aarav@uni.edu");     setPass("aarav123"); }
    setErr("");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.pageBg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: `0 8px 24px ${C.primary}50`, marginBottom: 16 }}>📚</div>
          <h1 style={{ fontFamily: "'Lora',serif", fontSize: 28, color: C.text, fontWeight: 700, margin: 0 }}>LibraryOS</h1>
          <p style={{ color: C.textLight, fontSize: 14, marginTop: 6 }}>Sign in to your library portal</p>
        </div>

        {/* Card */}
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 24, padding: 32, boxShadow: C.shadowLg }}>

          {/* Role tabs */}
          <div style={{ display: "flex", background: C.inputBg, borderRadius: 12, padding: 4, marginBottom: 28, border: `1.5px solid ${C.inputBorder}` }}>
            {([["admin", "🛡️ Admin"], ["student", "🎓 Student"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => { setTab(k); setErr(""); setEmail(""); setPass(""); }}
                style={{ flex: 1, padding: "10px", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all 0.2s", background: tab === k ? "#fff" : "transparent", color: tab === k ? C.primaryDark : C.textMid, boxShadow: tab === k ? C.shadow : "none" }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ color: C.textMid, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Email address</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder={tab === "admin" ? "admin@library.edu" : "your@uni.edu"}
                style={{ background: C.inputBg, border: `1.5px solid ${err ? C.red : C.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ color: C.textMid, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={show ? "text" : "password"} value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  style={{ background: C.inputBg, border: `1.5px solid ${err ? C.red : C.inputBorder}`, borderRadius: 10, padding: "10px 44px 10px 14px", color: C.text, fontSize: 14, outline: "none", width: "100%", fontFamily: "inherit" }} />
                <button onClick={() => setShow(s => !s)} type="button"
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textLight }}>{show ? "🙈" : "👁️"}</button>
              </div>
            </div>

            {err && (
              <div style={{ background: C.redBg, border: `1px solid ${C.red}30`, borderRadius: 10, padding: "10px 14px", color: C.red, fontSize: 13, fontWeight: 600 }}>⚠️ {err}</div>
            )}

            <button onClick={handleLogin} disabled={loading}
              style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, boxShadow: `0 4px 14px ${C.primary}45`, marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </div>

          {/* Demo credentials */}
          <div style={{ marginTop: 24, padding: "14px 16px", background: C.primaryBg, borderRadius: 12, border: `1px solid ${C.primary}25` }}>
            <div style={{ color: C.textMid, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Demo Credentials</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => demoFill("admin")}
                style={{ flex: 1, background: "#fff", border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, color: C.primaryDark, cursor: "pointer", fontFamily: "inherit" }}>🛡️ Use Admin</button>
              <button onClick={() => demoFill("student")}
                style={{ flex: 1, background: "#fff", border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, color: C.green, cursor: "pointer", fontFamily: "inherit" }}>🎓 Use Student</button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", color: C.textLight, fontSize: 12, marginTop: 20 }}>LibraryOS · Pastel Edition v2.0</p>
      </div>
    </div>
  );
}
