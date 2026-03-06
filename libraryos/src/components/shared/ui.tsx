"use client";
import { C } from "@/lib/tokens";
import { CSSProperties, ReactNode, useState } from "react";

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, color, bg }: { children: ReactNode; color: string; bg?: string }) {
  return (
    <span style={{ background: bg ?? `${color}18`, color, border: `1px solid ${color}38`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, display: "inline-block", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, color, bg }: { icon: string; label: string; value: string | number; sub?: string; color: string; bg: string }) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${color}28`, borderRadius: 18, padding: "20px 22px", position: "relative", overflow: "hidden", boxShadow: C.shadow }}>
      <div style={{ position: "absolute", top: -14, right: -14, width: 70, height: 70, background: color, borderRadius: "50%", opacity: 0.12 }} />
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: "'Lora',serif", letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 560 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(60,40,25,0.32)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 22, width, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto", boxShadow: C.shadowLg }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 26px", borderBottom: `1.5px solid ${C.cardBorder}` }}>
          <h3 style={{ margin: 0, color: C.text, fontFamily: "'Lora',serif", fontSize: 19, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textMid, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: 26 }}>{children}</div>
      </div>
    </div>
  );
}

// ── FInput ─────────────────────────────────────────────────────────────────
export function FInput({ label, style: s, ...p }: { label?: string; style?: CSSProperties; [k: string]: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ color: C.textMid, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>}
      <input {...p} style={{ background: C.inputBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", ...s }} />
    </div>
  );
}

// ── FSelect ────────────────────────────────────────────────────────────────
export function FSelect({ label, children, ...p }: { label?: string; children: ReactNode; [k: string]: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ color: C.textMid, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>}
      <select {...p} style={{ background: C.inputBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" }}>{children}</select>
    </div>
  );
}

// ── Btn ────────────────────────────────────────────────────────────────────
type Variant = "primary" | "success" | "danger" | "ghost" | "amber";
export function Btn({ children, variant = "primary", onClick, disabled, style = {}, type = "button" }: { children: ReactNode; variant?: Variant; onClick?: () => void; disabled?: boolean; style?: CSSProperties; type?: "button" | "submit" }) {
  const S: Record<Variant, CSSProperties> = {
    primary: { background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "#fff", border: "none", boxShadow: `0 4px 14px ${C.primary}45` },
    success: { background: `linear-gradient(135deg,${C.green},#3a9068)`,            color: "#fff", border: "none", boxShadow: `0 4px 14px ${C.green}45` },
    danger:  { background: `linear-gradient(135deg,${C.red},#c04f4f)`,              color: "#fff", border: "none", boxShadow: `0 4px 14px ${C.red}35` },
    ghost:   { background: C.inputBg,  color: C.textMid, border: `1.5px solid ${C.inputBorder}`, boxShadow: "none" },
    amber:   { background: `linear-gradient(135deg,${C.amber},#c97e20)`,            color: "#fff", border: "none", boxShadow: `0 4px 14px ${C.amber}45` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...S[variant], borderRadius: 10, padding: "10px 20px", cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", opacity: disabled ? 0.5 : 1, transition: "all 0.18s", ...style }}>
      {children}
    </button>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 200 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.primaryBg}`, borderTop: `3px solid ${C.primary}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "ok" | "err" }[]>([]);
  const toast = (msg: string, type: "ok" | "err" = "ok") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };
  const ToastContainer = () => (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type === "ok" ? C.green : C.red, color: "#fff", padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: C.shadowMd, maxWidth: 320, animation: "fadeIn 0.2s ease" }}>
          {t.type === "ok" ? "✓ " : "⚠ "}{t.msg}
        </div>
      ))}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
  return { toast, ToastContainer };
}
