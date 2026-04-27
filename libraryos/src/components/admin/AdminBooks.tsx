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
      <style>{`@media(max-width:560px){.book-form-grid{grid-template-columns:1fr!important}}`}</style>
      <ToastContainer />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 26, color: C.text }}>Book Inventory</h1>
          <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 13 }}>{books.length} titles · {books.reduce((a, b) => a + b.total, 0)} total copies</p>
        </div>
        <Btn onClick={openAdd}>＋ Add Book</Btn>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search title, author, ISBN…"
          style={{ background: C.cardBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none", flex: 1, minWidth: 160, fontFamily: "inherit" }} />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {["All", "Dystopian", "Fantasy", "Classic Fiction", "Non-Fiction", "Self-Help", "Romance"].map(g => (
            <button key={g} onClick={() => setGenre(g)}
              style={{ background: genre === g ? C.primary : C.cardBg, border: `1.5px solid ${genre === g ? C.primary : C.inputBorder}`, color: genre === g ? "#fff" : C.textMid, borderRadius: 8, padding: "7px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{g}</button>
          ))}
        </div>
      </div>

      <div style={{ background: C.cardBg, borderRadius: 16, border: `1.5px solid ${C.cardBorder}`, overflow: "hidden", boxShadow: C.shadow }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 580 }}>
            <thead>
              <tr style={{ background: C.inputBg, borderBottom: `1.5px solid ${C.cardBorder}` }}>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "35%" }}>Title</th>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "20%" }}>Author</th>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "15%" }}>Category</th>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "15%" }}>Status</th>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "15%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book, i) => {
                const bc = ACCENT_COLORS[i % ACCENT_COLORS.length];
                const bb = ACCENT_BGS[i % ACCENT_BGS.length];
                return (
                  <tr key={book.id} onClick={() => openDetail(book)} style={{ borderBottom: `1px solid ${C.cardBorder}`, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = C.pageBg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: bb, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>{book.cover}</div>
                        <div>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{book.title}</div>
                          <div style={{ color: C.textLight, fontSize: 11, fontFamily: "monospace" }}>ISBN: {book.isbn}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", color: C.textMid, fontSize: 13 }}>{book.author}</td>
                    <td style={{ padding: "13px 16px" }}><Badge color={bc}>{book.genre}</Badge></td>
                    <td style={{ padding: "13px 16px" }}>
                      {book.available > 0 ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.greenBg, color: C.green, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${C.green}25`, whiteSpace: "nowrap" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} /> {book.available} avail.
                        </div>
                      ) : (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.redBg, color: C.red, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${C.red}25`, whiteSpace: "nowrap" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.red }} /> Out of stock
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                        <button onClick={() => openIssue(book)} disabled={book.available < 1} style={{ background: C.text, color: "#fff", border: "none", padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: book.available < 1 ? "not-allowed" : "pointer", opacity: book.available < 1 ? 0.3 : 1, whiteSpace: "nowrap" }}>Issue</button>
                        <button onClick={() => openEdit(book)} style={{ background: C.inputBg, border: `1.5px solid ${C.inputBorder}`, padding: "5px 7px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>✏️</button>
                        <button onClick={() => delBook(book.id)} style={{ background: C.redBg, border: `1.5px solid ${C.red}35`, padding: "5px 7px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: C.textLight }}>No books found matching your criteria.</div>
        )}
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
          <div className="book-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
