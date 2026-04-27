"use client";
import { useState } from "react";
import { C, fmt, DEPARTMENTS } from "@/lib/tokens";
import { apiUpdateStudent } from "@/lib/client";
import { useAuth } from "../shared/AuthProvider";
import { Badge, FInput, FSelect, Btn, useToast } from "../shared/ui";

export function StudentProfile() {
  const { user, refresh } = useAuth();
  const [edit, setEdit]   = useState(false);
  const [form, setForm]   = useState<any>({});
  const { toast, ToastContainer } = useToast();

  const startEdit = () => {
    setForm({ name: user?.name, email: user?.email, phone: "", department: user?.department, year: 1 });
    setEdit(true);
  };

  const save = async () => {
    try {
      await apiUpdateStudent(user!.studentId!, form);
      await refresh();
      setEdit(false);
      toast("Profile updated!");
    } catch (e: any) { toast(e.message, "err"); }
  };

  if (!user) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ToastContainer />
      <style>{`@media(max-width:560px){.profile-grid{grid-template-columns:1fr!important}}`}</style>
      <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 26, color: C.text }}>My Profile</h1>

      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 22, padding: 28, boxShadow: C.shadow }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap" }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: `0 8px 20px ${C.primary}40` }}>
            {user.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 4px", fontFamily: "'Lora',serif", fontSize: 24, color: C.text }}>{user.name}</h2>
            <p style={{ margin: "0 0 10px", color: C.textMid, fontSize: 14 }}>{user.department}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge color={user.status === "suspended" ? C.red : C.green}>{user.status ?? "active"}</Badge>
              <Badge color={C.blue}>{user.studentCode}</Badge>
            </div>
          </div>
          {!edit && <Btn variant="ghost" onClick={startEdit}>✏️ Edit Profile</Btn>}
        </div>

        {edit ? (
          <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}><FInput label="Full Name" value={form.name} onChange={(e: any) => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <FInput label="Email" type="email" value={form.email} onChange={(e: any) => setForm((f: any) => ({ ...f, email: e.target.value }))} />
            <FInput label="Phone" value={form.phone} onChange={(e: any) => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
            <FSelect label="Department" value={form.department} onChange={(e: any) => setForm((f: any) => ({ ...f, department: e.target.value }))}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</FSelect>
            <FSelect label="Year" value={form.year} onChange={(e: any) => setForm((f: any) => ({ ...f, year: e.target.value }))}>{[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}</FSelect>
            <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setEdit(false)}>Cancel</Btn>
              <Btn variant="success" onClick={save}>Save Changes</Btn>
            </div>
          </div>
        ) : (
          <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["📧 Email", user.email],
              ["🏛️ Department", user.department],
              ["🪪 Student ID", user.studentCode],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: "12px 16px", background: C.inputBg, borderRadius: 12, border: `1px solid ${C.cardBorder}` }}>
                <div style={{ color: C.textLight, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 3 }}>{k}</div>
                <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password change hint */}
      <div style={{ background: C.primaryBg, border: `1.5px solid ${C.primary}25`, borderRadius: 16, padding: "16px 20px" }}>
        <div style={{ color: C.primaryDark, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🔒 Change Password</div>
        <div style={{ color: C.textMid, fontSize: 13 }}>To change your password, please visit the library counter with your student ID card.</div>
      </div>
    </div>
  );
}
