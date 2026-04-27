"use client";
import { useEffect, useState } from "react";
import { C, fmt, DEPARTMENTS, calcFine } from "@/lib/tokens";
import { apiStudents, apiAddStudent, apiUpdateStudent, apiDeleteStudent, apiStudent } from "@/lib/client";
import { Badge, Modal, FInput, FSelect, Btn, Spinner, useToast } from "../shared/ui";

const PALS = [
  { bg: "#f0ebfd", c: "#7155c0" },
  { bg: "#eaf6f0", c: "#2e7d58" },
  { bg: "#fef5e6", c: "#9a5f1c" },
  { bg: "#fdeef4", c: "#b5436a" },
  { bg: "#edf5fc", c: "#3a6ea8" },
  { bg: "#eaf5f7", c: "#2a7f86" },
];

type ModalState = null | "add" | "edit" | "profile" | "credentials";

export function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [sel, setSel] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [profileDetail, setProfileDetail] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [credentialsStudent, setCredentialsStudent] = useState<any>(null);
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    setStudents(await apiStudents());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (modal !== "profile" || !sel?.id) {
      setProfileDetail(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    setProfileDetail(null);
    apiStudent(sel.id)
      .then((d) => {
        if (!cancelled) setProfileDetail(d);
      })
      .catch((e: any) => {
        if (!cancelled) toast(e.message ?? "Failed to load profile", "err");
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modal, sel?.id, toast]);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      department: "Nursery",
      year: 1,
      status: "active",
      joined: new Date().toISOString().split("T")[0],
    });
    setModal("add");
  };

  const openEdit = (s: any) => {
    setForm({ ...s, password: "" });
    setSel(s);
    setModal("edit");
  };

  const openProfile = (s: any) => {
    setSel(s);
    setModal("profile");
  };

  const save = async () => {
    try {
      let finalForm = { ...form };
      if (modal === "add") {
        if (!finalForm.name?.trim()) return toast("Name is required", "err");
        const created = await apiAddStudent({
          name: finalForm.name.trim(),
          email: finalForm.email?.trim() || undefined,
          phone: finalForm.phone ?? "",
          department: finalForm.department ?? "Nursery",
          year: +finalForm.year || 1,
          joined: finalForm.joined,
          status: finalForm.status ?? "active",
        });
        await load();
        setCredentialsStudent(created);
        setModal("credentials");
        return;
      }

      if (!finalForm.email) {
        finalForm.email = `${String(finalForm.studentCode).toLowerCase()}@library.local`;
      }
      await apiUpdateStudent(sel.id, finalForm);
      await load();
      setModal(null);
      toast("Student updated!");
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const toggle = async (s: any) => {
    try {
      await apiUpdateStudent(s.id, { ...s, status: s.status === "active" ? "suspended" : "active" });
      await load();
      toast("Status updated");
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const del = async (id: number) => {
    if (!confirm("Delete student? This cannot be undone.")) return;
    try {
      await apiDeleteStudent(id);
      await load();
      toast("Student deleted");
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const txLiveFine = (t: any) => (t.returnDate ? t.fine : calcFine(t.dueDate));

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ToastContainer />
      <style>{`@media(max-width:560px){.stu-form-grid{grid-template-columns:1fr!important}}`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>Library Kids</h1>
          <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 13 }}>{students.length} young readers registered</p>
        </div>
        <Btn onClick={openAdd}>🧒 Add Little Reader</Btn>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍  Search by name or Student ID..."
        style={{
          background: C.cardBg,
          border: `1.5px solid ${C.inputBorder}`,
          borderRadius: 10,
          padding: "9px 14px",
          color: C.text,
          fontSize: 13,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(272px,1fr))", gap: 16 }}>
        {filtered.map((s, i) => {
          const pal = PALS[i % PALS.length];
          return (
            <div
              key={s.id}
              onClick={() => openProfile(s)}
              style={{
                background: C.cardBg,
                border: `1.5px solid ${C.cardBorder}`,
                borderRadius: 18,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: C.shadow,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadowMd;
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow;
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 13,
                    background: pal.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 15,
                    color: pal.c,
                    border: `2px solid ${pal.c}22`,
                    flexShrink: 0,
                  }}
                >
                  {s.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                  <div style={{ color: C.textLight, fontSize: 11 }}>
                    {s.studentCode} · Year {s.year}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Badge color={s.status === "active" ? C.green : C.red}>{s.status}</Badge>
                  </div>
                </div>
              </div>
              <div style={{ color: C.textMid, fontSize: 12, marginBottom: 2 }}>🧒 Class: {s.department}</div>

              <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                <Btn variant="ghost" style={{ flex: 1, padding: "7px 10px", fontSize: 12 }} onClick={() => openEdit(s)}>
                  ✏️ Edit
                </Btn>
                <Btn
                  variant={s.status === "active" ? "danger" : "success"}
                  style={{ flex: 1, padding: "7px 10px", fontSize: 12, boxShadow: "none" }}
                  onClick={() => toggle(s)}
                >
                  {s.status === "active" ? "Suspend" : "Activate"}
                </Btn>
                <Btn variant="danger" style={{ padding: "7px 10px", fontSize: 12, boxShadow: "none" }} onClick={() => del(s.id)}>
                  🗑️
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* New member: show assigned ID + auto password */}
      {modal === "credentials" && credentialsStudent && (
        <Modal title="Welcome — login details" onClose={() => { setModal(null); setCredentialsStudent(null); }} width={520}>
          <p style={{ margin: "0 0 16px", color: C.textMid, fontSize: 14 }}>
            Share these with the family once. Password is the first word of the name (letters only, lower case) plus <strong>123</strong>.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "14px 16px", background: C.inputBg, borderRadius: 12, border: `1px solid ${C.cardBorder}` }}>
              <div style={{ color: C.textLight, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Student ID</div>
              <div style={{ color: C.text, fontSize: 18, fontWeight: 800, fontFamily: "monospace" }}>{credentialsStudent.studentCode}</div>
            </div>
            <div style={{ padding: "14px 16px", background: C.amberBg, borderRadius: 12, border: `1px solid ${C.amber}45` }}>
              <div style={{ color: C.textLight, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Login password</div>
              <div style={{ color: C.text, fontSize: 18, fontWeight: 800, fontFamily: "monospace", letterSpacing: 0.5 }}>{credentialsStudent.plainPassword}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
            <Btn
              variant="ghost"
              onClick={() => {
                setSel(credentialsStudent);
                setModal("profile");
                setCredentialsStudent(null);
              }}
            >
              View full history
            </Btn>
            <Btn onClick={() => { setModal(null); setCredentialsStudent(null); }}>Done</Btn>
          </div>
        </Modal>
      )}

      {/* Profile + full transaction history */}
      {modal === "profile" && sel && (
        <Modal title="Student profile & history" onClose={() => setModal(null)} width={720}>
          <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: C.primaryBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 22,
                color: C.primaryDark,
                flexShrink: 0,
              }}
            >
              {sel.avatar}
            </div>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 20, fontFamily: "'Lora',serif" }}>{sel.name}</div>
              <div style={{ color: C.textMid, fontSize: 13 }}>
                {sel.studentCode} · {sel.department} · Year {sel.year}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <Badge color={sel.status === "active" ? C.green : C.red}>{sel.status}</Badge>
                <Badge color={C.blue}>Joined {fmt(sel.joined)}</Badge>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {[
              ["📧 Email", sel.email],
              ["📱 Phone", sel.phone || "—"],
              ["🏛️ Class", sel.department],
              ["🔑 Password", profileDetail?.plainPassword ?? sel.plainPassword ?? "—"],
            ].map(([k, v]) => (
              <div
                key={String(k)}
                style={{
                  padding: "10px 14px",
                  background: k === "🔑 Password" ? C.amberBg : C.inputBg,
                  borderRadius: 11,
                  border: `1px solid ${k === "🔑 Password" ? C.amber + "50" : C.cardBorder}`,
                }}
              >
                <div style={{ color: C.textLight, fontSize: 11, marginBottom: 2 }}>{k}</div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 10, fontFamily: "'Lora',serif" }}>All activity</div>
          {profileLoading && (
            <div style={{ padding: 24 }}>
              <Spinner />
            </div>
          )}
          {!profileLoading && profileDetail?.transactions?.length === 0 && (
            <div style={{ color: C.textLight, fontSize: 13, padding: "12px 0" }}>No issues or returns yet.</div>
          )}
          {!profileLoading && profileDetail?.transactions?.length > 0 && (
            <div
              style={{
                maxHeight: 360,
                overflowY: "auto",
                border: `1.5px solid ${C.cardBorder}`,
                borderRadius: 14,
                background: C.cardBg,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.inputBg, borderBottom: `1.5px solid ${C.cardBorder}` }}>
                    {["Book", "Type", "Issued", "Due", "Returned", "Fine"].map((h) => (
                      <th key={h} style={{ textAlign: h === "Book" ? "left" : "left", padding: "10px 12px", color: C.textLight, fontWeight: 700 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profileDetail.transactions.map((t: any) => {
                    const lf = txLiveFine(t);
                    const overdue = !t.returnDate && t.type === "issue" && new Date(t.dueDate) < new Date();
                    return (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                        <td style={{ padding: "10px 12px", color: C.text, fontWeight: 600 }}>
                          <div>{t.bookTitle}</div>
                          {t.book?.isbn && <div style={{ color: C.textLight, fontSize: 10, fontFamily: "monospace" }}>{t.book.isbn}</div>}
                        </td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          <Badge color={t.type === "issue" ? C.primary : C.green}>{t.type}</Badge>
                        </td>
                        <td style={{ padding: "10px 12px", color: C.textMid, whiteSpace: "nowrap" }}>{fmt(t.date)}</td>
                        <td style={{ padding: "10px 12px", color: overdue ? C.red : C.textMid, fontWeight: overdue ? 700 : 400, whiteSpace: "nowrap" }}>
                          {fmt(t.dueDate)}
                        </td>
                        <td style={{ padding: "10px 12px", color: C.textMid, whiteSpace: "nowrap" }}>{t.returnDate ? fmt(t.returnDate) : "—"}</td>
                        <td style={{ padding: "10px 12px", color: lf > 0 ? C.red : C.textLight, fontWeight: lf > 0 ? 700 : 400, whiteSpace: "nowrap" }}>
                          {lf > 0 ? `₹${lf}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add Student" : "Edit Student"} onClose={() => setModal(null)}>
          <div className="stu-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <FInput label="Full Name" value={form.name} onChange={(e: any) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
            </div>
            {modal === "edit" && (
              <div style={{ gridColumn: "1/-1" }}>
                <FInput label="Student ID (Badge Number)" value={form.studentCode} onChange={(e: any) => setForm((f: any) => ({ ...f, studentCode: e.target.value }))} />
              </div>
            )}
            {modal === "add" && (
              <div style={{ gridColumn: "1/-1", padding: "10px 14px", background: C.primaryBg, borderRadius: 12, border: `1px solid ${C.primary}30`, color: C.textMid, fontSize: 13 }}>
                Student ID and login password are created automatically when you save. You will see them on the next screen.
              </div>
            )}
            <FInput
              label="Email (Optional for kids)"
              type="email"
              value={form.email}
              placeholder="Leave blank to auto-generate from ID"
              onChange={(e: any) => setForm((f: any) => ({ ...f, email: e.target.value }))}
            />
            {modal === "edit" && (
              <FInput
                label="Change Password"
                type="text"
                value={form.password}
                placeholder="Leave blank to keep same"
                onChange={(e: any) => setForm((f: any) => ({ ...f, password: e.target.value }))}
              />
            )}
            <FInput label="Parent's Phone" value={form.phone} onChange={(e: any) => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
            <FSelect label="Class / Grade" value={form.department} onChange={(e: any) => setForm((f: any) => ({ ...f, department: e.target.value }))}>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </FSelect>
            <FSelect label="Reading Level" value={form.year} onChange={(e: any) => setForm((f: any) => ({ ...f, year: e.target.value }))}>
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  Level {y}
                </option>
              ))}
            </FSelect>
            <FSelect label="Status" value={form.status} onChange={(e: any) => setForm((f: any) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </FSelect>
            <FInput label="Join Date" type="date" value={form.joined} onChange={(e: any) => setForm((f: any) => ({ ...f, joined: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn onClick={() => void save()}>{modal === "add" ? "Add Student" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
