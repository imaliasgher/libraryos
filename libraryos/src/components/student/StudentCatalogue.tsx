"use client";
import { useEffect, useState } from "react";
import { C, fmt, addDays, ACCENT_COLORS, ACCENT_BGS } from "@/lib/tokens";
import { apiBooks, apiTransactions, apiBorrowBook } from "@/lib/client";
import { Badge, Modal, Btn, Spinner, useToast } from "../shared/ui";

export function StudentCatalogue() {
  const [books, setBooks]   = useState<any[]>([]);
  const [txs, setTxs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre]   = useState("All");
  const [avOnly, setAvOnly] = useState(false);
  const [sel, setSel]       = useState<any>(null);
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    const [b, t] = await Promise.all([apiBooks(), apiTransactions()]);
    setBooks(b); setTxs(t); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const active = txs.filter(t => t.type === "issue" && !t.returnDate);
  const alreadyHas = (bookId: number) => active.some(t => t.bookId === bookId);

  const genres = ["All", ...Array.from(new Set(books.map(b => b.genre)))];
  const filtered = books.filter(b => {
    const ms = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.genre.toLowerCase().includes(search.toLowerCase());
    const mg = genre === "All" || b.genre === genre;
    const ma = !avOnly || b.available > 0;
    return ms && mg && ma;
  });

  const borrow = async (book: any) => {
    if (book.available < 1 || alreadyHas(book.id)) return;
    try { await apiBorrowBook(book.id, 30); await load(); setSel(null); toast("Borrowed! Return in 30 days."); }
    catch (e: any) { toast(e.message, "err"); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ToastContainer />
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>The Story Room</h1>
        <p style={{ margin: "4px 0 0", color: C.textMid, fontSize: 15, fontWeight: 600 }}>Pick an adventure today! ✨ {books.filter(b => b.available > 0).length} stories are ready for you.</p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search by title, author, genre…"
          style={{ background: C.cardBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none", flex: 1, minWidth: 200, fontFamily: "inherit" }} />
        <button onClick={() => setAvOnly(a => !a)}
          style={{ background: avOnly ? C.green : C.cardBg, border: `1.5px solid ${avOnly ? C.green : C.inputBorder}`, color: avOnly ? "#fff" : C.textMid, borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {avOnly ? "✓ Available only" : "Available only"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {genres.map(g => (
          <button key={g} onClick={() => setGenre(g)}
            style={{ background: genre === g ? C.primary : C.cardBg, border: `1.5px solid ${genre === g ? C.primary : C.inputBorder}`, color: genre === g ? "#fff" : C.textMid, borderRadius: 8, padding: "6px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>{g}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(245px,1fr))", gap: 16 }}>
        {filtered.map((book, i) => {
          const bc = ACCENT_COLORS[i % ACCENT_COLORS.length];
          const bb = ACCENT_BGS[i % ACCENT_BGS.length];
          const has = alreadyHas(book.id);
          return (
            <div key={book.id} onClick={() => setSel(book)}
              style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderTop: `4px solid ${bc}`, borderRadius: 18, padding: 20, cursor: "pointer", transition: "all 0.2s", boxShadow: C.shadow, opacity: book.available === 0 ? 0.75 : 1 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadowMd; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: bb, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 12 }}>{book.cover}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Badge color={has ? C.blue : book.available > 0 ? C.green : C.red}>{has ? "In your shelf" : book.available > 0 ? `${book.available} avail.` : "All out"}</Badge>
                <span style={{ color: C.textLight, fontSize: 11 }}>{book.year > 0 ? book.year : `${Math.abs(book.year)} BC`}</span>
              </div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 3, lineHeight: 1.3 }}>{book.title}</div>
              <div style={{ color: C.textMid, fontSize: 12, marginBottom: 8 }}>by {book.author}</div>
              <div style={{ color: C.textLight, fontSize: 11, marginBottom: 14, lineHeight: 1.5 }}>{book.description?.substring(0, 70)}…</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "space-between", alignItems: "center" }}>
                <Badge color={bc}>{book.genre}</Badge>
                <button onClick={e => { e.stopPropagation(); borrow(book); }} disabled={book.available < 1 || has}
                  style={{ background: has ? C.blueBg : book.available < 1 ? "#f5f0eb" : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: has ? C.blue : book.available < 1 ? C.textLight : "#fff", border: `1.5px solid ${has ? C.blue : book.available < 1 ? C.inputBorder : C.primary}`, borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: book.available < 1 || has ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {has ? "Borrowed" : book.available < 1 ? "Unavailable" : "Borrow"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {sel && (
        <Modal title={sel.title} onClose={() => setSel(null)} width={580}>
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, flexShrink: 0 }}>{sel.cover}</div>
            <div>
              <div style={{ color: C.textMid, fontSize: 13, marginBottom: 4 }}>by {sel.author}</div>
              <div style={{ color: C.text, fontSize: 14, lineHeight: 1.65, marginBottom: 12 }}>{sel.description}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge color={C.primary}>{sel.genre}</Badge>
                <Badge color={C.amber}>{sel.year > 0 ? sel.year : `${Math.abs(sel.year)} BC`}</Badge>
                <Badge color={alreadyHas(sel.id) ? C.blue : sel.available > 0 ? C.green : C.red}>
                  {alreadyHas(sel.id) ? "In your shelf" : sel.available > 0 ? `${sel.available} copies available` : "Not available"}
                </Badge>
              </div>
            </div>
          </div>
          <div style={{ background: C.inputBg, borderRadius: 14, padding: "14px 18px", marginBottom: 20, border: `1px solid ${C.cardBorder}` }}>
            {[["Total copies", sel.total], ["Available now", sel.available], ["Loan period", "30 days"], ["Fine rate", "₹10 / day"]].map(([k, v]) => (
              <div key={k as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: C.textMid, fontSize: 13 }}>{k}</span>
                <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setSel(null)}>Close</Btn>
            {!alreadyHas(sel.id) && sel.available > 0 && <Btn variant="success" onClick={() => borrow(sel)}>Borrow this book ✓</Btn>}
          </div>
        </Modal>
      )}
    </div>
  );
}
