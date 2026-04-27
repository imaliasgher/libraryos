"use client";
import { useState } from "react";
import { C } from "@/lib/tokens";
import { apiLogin } from "@/lib/client";
import { useAuth } from "./AuthProvider";

export function LoginScreen() {
  const { refresh } = useAuth();
  const [tab, setTab]       = useState<"admin" | "student">("admin");
  const [ident, setIdent]   = useState("");
  const [pass, setPass]     = useState("");
  const [show, setShow]     = useState(false);
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!ident || !pass) return setErr("Please enter your ID and password.");
    setErr(""); setLoading(true);
    try {
      await apiLogin(ident, pass);
      await refresh();
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const demoFill = (who: "admin" | "student") => {
    setTab(who);
    if (who === "admin")   { setIdent("admin@library.edu"); setPass("admin123"); }
    else                   { setIdent("STU001");            setPass("aarav123"); }
    setErr("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fdf8f5", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 80, height: 80, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: `0 12px 32px ${C.primary}40`, marginBottom: 16 }}>📖</div>
          <h1 style={{ fontFamily: "'Lora',serif", fontSize: 32, color: C.text, fontWeight: 800, margin: 0 }}>LibraryOS Kids</h1>
          <p style={{ color: C.textLight, fontSize: 16, marginTop: 8 }}>Ready to read some stories? ✨</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", border: `2px solid ${C.cardBorder}`, borderRadius: 32, padding: 40, boxShadow: "0 20px 50px rgba(0,0,0,0.06)" }}>

          {/* Role tabs */}
          <div style={{ display: "flex", background: C.inputBg, borderRadius: 16, padding: 6, marginBottom: 32, border: `1.5px solid ${C.inputBorder}` }}>
            {([["admin", "👤 Admin"], ["student", "🎒 Student"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => { setTab(k); setErr(""); setIdent(""); setPass(""); }}
                style={{ flex: 1, padding: "12px", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 800, fontFamily: "inherit", transition: "all 0.2s", background: tab === k ? C.primary : "transparent", color: tab === k ? "#fff" : C.textMid }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* ID */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: C.text, fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{tab === "admin" ? "Email Address" : "Your Student ID"}</label>
              <input type="text" value={ident} onChange={e => { setIdent(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder={tab === "admin" ? "admin@library.edu" : "e.g. STU001"}
                style={{ background: C.inputBg, border: `2px solid ${err ? C.red : C.inputBorder}`, borderRadius: 14, padding: "14px 18px", color: C.text, fontSize: 15, outline: "none", fontFamily: "inherit" }} />
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: C.text, fontSize: 13, fontWeight: 700, marginLeft: 4 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={show ? "text" : "password"} value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  style={{ background: C.inputBg, border: `2px solid ${err ? C.red : C.inputBorder}`, borderRadius: 14, padding: "14px 50px 14px 18px", color: C.text, fontSize: 15, outline: "none", width: "100%", fontFamily: "inherit" }} />
                <button onClick={() => setShow(s => !s)} type="button"
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textLight }}>{show ? "🙈" : "👁️"}</button>
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
