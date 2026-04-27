"use client";
import { useEffect, useState } from "react";
import { C, fmt, DEPARTMENTS, initials } from "@/lib/tokens";
import { apiStudents, apiAddStudent, apiUpdateStudent, apiDeleteStudent } from "@/lib/client";
import { Badge, Modal, FInput, FSelect, Btn, Spinner, useToast } from "../shared/ui";

const PALS = [
  { bg: "#f0ebfd", c: "#7155c0" }, { bg: "#eaf6f0", c: "#2e7d58" },
  { bg: "#fef5e6", c: "#9a5f1c" }, { bg: "#fdeef4", c: "#b5436a" },
  { bg: "#edf5fc", c: "#3a6ea8" }, { bg: "#eaf5f7", c: "#2a7f86" },
];

export function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState<null | "add" | "edit" | "profile">(null);
  const [sel, setSel]           = useState<any>(null);
  const [form, setForm]         = useState<any>({});
  const { toast, ToastContainer } = useToast();

  const load = async () => { setStudents(await apiStudents()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    const code = `STU${String(students.length + 1).padStart(3, "0")}`;
    setForm({ name: "", studentCode: code, email: "", password: "pass123", phone: "", department: "Computer Science", year: 1, status: "active", joined: new Date().toISOString().split("T")[0] });
    setModal("add");
  };
  const openEdit    = (s: any) => { setForm({ ...s }); setSel(s); setModal("edit"); };
  const openProfile = (s: any) => { setSel(s); setModal("profile"); };

  const save = async () => {
    try {
      if (modal === "add") await apiAddStudent(form);
      else await apiUpdateStudent(sel.id, form);
      await load(); setModal(null); toast(modal === "add" ? "Student added!" : "Student updated!");
    } catch (e: any) { toast(e.message, "err"); }
  };

  const toggle = async (s: any) => {
    try {
      await apiUpdateStudent(s.id, { ...s, status: s.status === "active" ? "suspended" : "active" });
      await load(); toast("Status updated");
    } catch (e: any) { toast(e.message, "err"); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete student? This cannot be undone.")) return;
    try { await apiDeleteStudent(id); await load(); toast("Student deleted"); } catch (e: any) { toast(e.message, "err"); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ToastContainer />
      <style>{`@media(max-width:560px){.stu-form-grid{grid-template-columns:1fr!important}}`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>Student Members</h1>
          <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 13 }}>{students.length} registered members</p>
        </div>
        <Btn onClick={openAdd}>＋ Add Student</Btn>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search name, ID, email, department…"
        style={{ background: C.cardBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(272px,1fr))", gap: 16 }}>
        {filtered.map((s, i) => {
          const pal = PALS[i % PALS.length];
          return (
            <div key={s.id} onClick={() => openProfile(s)}
              style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 20, cursor: "pointer", transition: "all 0.2s", boxShadow: C.shadow }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadowMd; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: pal.c, border: `2px solid ${pal.c}22`, flexShrink: 0 }}>{s.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                  <div style={{ color: C.textLight, fontSize: 11 }}>{s.studentCode} · Year {s.year}</div>
                  <div style={{ marginTop: 4 }}><Badge color={s.status === "active" ? C.green : C.red}>{s.status}</Badge></div>
                </div>
              </div>
              <div style={{ color: C.textMid, fontSize: 12, marginBottom: 2 }}>🎓 {s.department}</div>
              <div style={{ color: C.textMid, fontSize: 12, marginBottom: 12 }}>📧 {s.email}</div>
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <Btn variant="ghost" style={{ flex: 1, padding: "7px 10px", fontSize: 12 }} onClick={() => openEdit(s)}>✏️ Edit</Btn>
                <Btn variant={s.status === "active" ? "danger" : "success"} style={{ flex: 1, padding: "7px 10px", fontSize: 12, boxShadow: "none" }} onClick={() => toggle(s)}>{s.status === "active" ? "Suspend" : "Activate"}</Btn>
                <Btn variant="danger" style={{ padding: "7px 10px", fontSize: 12, boxShadow: "none" }} onClick={() => del(s.id)}>🗑️</Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile modal */}
      {modal === "profile" && sel && (
        <Modal title="Student Profile" onClose={() => setModal(null)} width={580}>
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: C.primaryDark, flexShrink: 0 }}>{sel.avatar}</div>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 20, fontFamily: "'Lora',serif" }}>{sel.name}</div>
              <div style={{ color: C.textMid, fontSize: 13 }}>{sel.studentCode} · {sel.department} · Year {sel.year}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <Badge color={sel.status === "active" ? C.green : C.red}>{sel.status}</Badge>
                <Badge color={C.blue}>Joined {fmt(sel.joined)}</Badge>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["📧 Email", sel.email], ["📱 Phone", sel.phone || "—"], ["🏛️ Department", sel.department], ["📅 Joined", fmt(sel.joined)]].map(([k, v]) => (
              <div key={k} style={{ padding: "10px 14px", background: C.inputBg, borderRadius: 11, border: `1px solid ${C.cardBorder}` }}>
                <div style={{ color: C.textLight, fontSize: 11, marginBottom: 2 }}>{k}</div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Add/Edit modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add Student" : "Edit Student"} onClose={() => setModal(null)}>
          <div className="stu-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}><FInput label="Full Name" value={form.name} onChange={(e: any) => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <FInput label="Student Code" value={form.studentCode} onChange={(e: any) => setForm((f: any) => ({ ...f, studentCode: e.target.value }))} />
            <FInput label="Email" type="email" value={form.email} onChange={(e: any) => setForm((f: any) => ({ ...f, email: e.target.value }))} />
            {modal === "add" && <FInput label="Password" type="password" value={form.password} onChange={(e: any) => setForm((f: any) => ({ ...f, password: e.target.value }))} />}
            <FInput label="Phone" value={form.phone} onChange={(e: any) => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
            <FSelect label="Department" value={form.department} onChange={(e: any) => setForm((f: any) => ({ ...f, department: e.target.value }))}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</FSelect>
            <FSelect label="Year" value={form.year} onChange={(e: any) => setForm((f: any) => ({ ...f, year: e.target.value }))}>{[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}</FSelect>
            <FSelect label="Status" value={form.status} onChange={(e: any) => setForm((f: any) => ({ ...f, status: e.target.value }))}><option value="active">Active</option><option value="suspended">Suspended</option></FSelect>
            <FInput label="Join Date" type="date" value={form.joined} onChange={(e: any) => setForm((f: any) => ({ ...f, joined: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save}>{modal === "add" ? "Add Student" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
