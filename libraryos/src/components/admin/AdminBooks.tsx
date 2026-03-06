"use client";
import { useEffect, useState } from "react";
import { C, fmt, ACCENT_COLORS, ACCENT_BGS, GENRES, addDays } from "@/lib/tokens";
import { apiBooks, apiStudents, apiAddBook, apiUpdateBook, apiDeleteBook, apiIssueBook } from "@/lib/client";
import { Badge, Modal, FInput, FSelect, Btn, Spinner, useToast } from "../shared/ui";

export function AdminBooks() {
  const [books, setBooks]     = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [genre, setGenre]     = useState("All");
  const [modal, setModal]     = useState<null | "add" | "edit" | "issue" | "detail">(null);
  const [sel, setSel]         = useState<any>(null);
  const [form, setForm]       = useState<any>({});
  const [issueForm, setIssueForm] = useState({ studentId: "", days: 30 });
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    const [b, s] = await Promise.all([apiBooks(), apiStudents()]);
    setBooks(b); setStudents(s); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = books.filter(b =>
    (genre === "All" || b.genre === genre) &&
    (b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.isbn.includes(search))
  );

  const openAdd = () => { setForm({ title: "", author: "", isbn: "", genre: "Classic Fiction", cover: "📖", total: 1, available: 1, year: new Date().getFullYear(), description: "" }); setModal("add"); };
  const openEdit = (b: any) => { setForm({ ...b }); setSel(b); setModal("edit"); };
  const openDetail = (b: any) => { setSel(b); setModal("detail"); };
  const openIssue = (b: any) => { setSel(b); setIssueForm({ studentId: "", days: 30 }); setModal("issue"); };

  const saveBook = async () => {
    try {
      if (modal === "add") await apiAddBook(form);
      else await apiUpdateBook(sel.id, form);
      await load(); setModal(null); toast(modal === "add" ? "Book added!" : "Book updated!");
    } catch (e: any) { toast(e.message, "err"); }
  };

  const delBook = async (id: number) => {
    if (!confirm("Delete this book?")) return;
    try { await apiDeleteBook(id); await load(); toast("Book deleted"); } catch (e: any) { toast(e.message, "err"); }
  };

  const issueBook = async () => {
    try {
      await apiIssueBook(sel.id, +issueForm.studentId, +issueForm.days);
      await load(); setModal(null); toast("Book issued!");
    } catch (e: any) { toast(e.message, "err"); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ToastContainer />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>Book Inventory</h1>
          <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 13 }}>{books.length} titles · {books.reduce((a, b) => a + b.total, 0)} total copies</p>
        </div>
        <Btn onClick={openAdd}>＋ Add Book</Btn>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search title, author, ISBN…"
          style={{ background: C.cardBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none", flex: 1, minWidth: 180, fontFamily: "inherit" }} />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {["All", "Dystopian", "Fantasy", "Classic Fiction", "Non-Fiction", "Self-Help", "Romance"].map(g => (
            <button key={g} onClick={() => setGenre(g)}
              style={{ background: genre === g ? C.primary : C.cardBg, border: `1.5px solid ${genre === g ? C.primary : C.inputBorder}`, color: genre === g ? "#fff" : C.textMid, borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{g}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(248px,1fr))", gap: 16 }}>
        {filtered.map((book, i) => {
          const bc = ACCENT_COLORS[i % ACCENT_COLORS.length];
          const bb = ACCENT_BGS[i % ACCENT_BGS.length];
          return (
            <div key={book.id} onClick={() => openDetail(book)}
              style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderTop: `4px solid ${bc}`, borderRadius: 18, padding: 20, cursor: "pointer", transition: "all 0.2s", boxShadow: C.shadow }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadowMd; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: bb, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 12 }}>{book.cover}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Badge color={book.available > 0 ? C.green : C.red}>{book.available > 0 ? `${book.available} avail.` : "All out"}</Badge>
                <span style={{ color: C.textLight, fontSize: 11 }}>{book.year > 0 ? book.year : `${Math.abs(book.year)} BC`}</span>
              </div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 3, lineHeight: 1.3 }}>{book.title}</div>
              <div style={{ color: C.textMid, fontSize: 12, marginBottom: 8 }}>by {book.author}</div>
              <div style={{ color: C.textLight, fontSize: 11, marginBottom: 14, lineHeight: 1.5 }}>{book.description?.substring(0, 70)}…</div>
              <Badge color={bc}>{book.genre}</Badge>
              <div style={{ display: "flex", gap: 6, marginTop: 14 }} onClick={e => e.stopPropagation()}>
                <Btn variant="primary" style={{ flex: 1, padding: "8px 10px", fontSize: 12, boxShadow: "none" }} onClick={() => openIssue(book)} disabled={book.available < 1}>Issue</Btn>
                <Btn variant="ghost" style={{ padding: "8px 10px", fontSize: 12 }} onClick={() => openEdit(book)}>✏️</Btn>
                <Btn variant="danger" style={{ padding: "8px 10px", fontSize: 12, boxShadow: "none" }} onClick={() => delBook(book.id)}>🗑️</Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {modal === "detail" && sel && (
        <Modal title={sel.title} onClose={() => setModal(null)} width={580}>
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ width: 70, height: 70, borderRadius: 18, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, flexShrink: 0 }}>{sel.cover}</div>
            <div>
              <div style={{ color: C.textMid, fontSize: 13, marginBottom: 4 }}>by {sel.author} · {sel.year > 0 ? sel.year : `${Math.abs(sel.year)} BC`}</div>
              <div style={{ color: C.text, fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{sel.description}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge color={C.primary}>{sel.genre}</Badge>
                <Badge color={C.amber}>ISBN: {sel.isbn}</Badge>
                <Badge color={C.green}>{sel.available}/{sel.total} available</Badge>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add New Book" : "Edit Book"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}><FInput label="Title" value={form.title} onChange={(e: any) => setForm((f: any) => ({ ...f, title: e.target.value }))} /></div>
            <FInput label="Author" value={form.author} onChange={(e: any) => setForm((f: any) => ({ ...f, author: e.target.value }))} />
            <FInput label="ISBN" value={form.isbn} onChange={(e: any) => setForm((f: any) => ({ ...f, isbn: e.target.value }))} />
            <FSelect label="Genre" value={form.genre} onChange={(e: any) => setForm((f: any) => ({ ...f, genre: e.target.value }))}>{GENRES.filter(g => g !== "All").map(g => <option key={g}>{g}</option>)}</FSelect>
            <FInput label="Cover Emoji" value={form.cover} onChange={(e: any) => setForm((f: any) => ({ ...f, cover: e.target.value }))} />
            <FInput label="Year" type="number" value={form.year} onChange={(e: any) => setForm((f: any) => ({ ...f, year: e.target.value }))} />
            <FInput label="Total Copies" type="number" value={form.total} onChange={(e: any) => setForm((f: any) => ({ ...f, total: e.target.value }))} />
            <FInput label="Available" type="number" value={form.available} onChange={(e: any) => setForm((f: any) => ({ ...f, available: e.target.value }))} />
            <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ color: C.textMid, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Description</label>
              <textarea value={form.description} onChange={(e: any) => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={3}
                style={{ background: C.inputBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={saveBook}>{modal === "add" ? "Add Book" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}

      {/* Issue modal */}
      {modal === "issue" && sel && (
        <Modal title={`Issue: ${sel.title}`} onClose={() => setModal(null)}>
          <div style={{ display: "flex", gap: 14, marginBottom: 20, padding: 14, background: C.primaryBg, borderRadius: 14, border: `1.5px solid ${C.primary}25` }}>
            <span style={{ fontSize: 36 }}>{sel.cover}</span>
            <div>
              <div style={{ color: C.text, fontWeight: 700 }}>{sel.title}</div>
              <div style={{ color: C.textMid, fontSize: 13 }}>by {sel.author}</div>
              <div style={{ marginTop: 5 }}><Badge color={C.green}>{sel.available} copies available</Badge></div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FSelect label="Select Student" value={issueForm.studentId} onChange={(e: any) => setIssueForm(f => ({ ...f, studentId: e.target.value }))}>
              <option value="">— choose student —</option>
              {students.filter(s => s.status === "active").map(s => <option key={s.id} value={s.id}>{s.name} ({s.studentCode})</option>)}
            </FSelect>
            <FInput label="Loan Duration (days)" type="number" value={issueForm.days} onChange={(e: any) => setIssueForm(f => ({ ...f, days: e.target.value }))} />
            {issueForm.days && <div style={{ color: C.textMid, fontSize: 12 }}>Due date: <strong style={{ color: C.text }}>{fmt(addDays(+issueForm.days))}</strong></div>}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn variant="success" onClick={issueBook} disabled={!issueForm.studentId}>Confirm Issue</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
