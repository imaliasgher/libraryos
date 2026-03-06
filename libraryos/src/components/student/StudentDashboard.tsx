"use client";
import { useEffect, useState } from "react";
import { C, fmt, calcFine, daysLeft, addDays } from "@/lib/tokens";
import { apiTransactions, apiBooks, apiBorrowBook } from "@/lib/client";
import { useAuth } from "../shared/AuthProvider";
import { StatCard, Badge, Modal, Btn, Spinner, useToast } from "../shared/ui";

export function StudentDashboard() {
  const { user } = useAuth();
  const [txs, setTxs]     = useState<any[]>([]);
  const [books, setBooks]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]  = useState(false);
  const [selBook, setSelBook] = useState<any>(null);
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    const [t, b] = await Promise.all([apiTransactions(), apiBooks()]);
    setTxs(t); setBooks(b); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const active  = txs.filter(t => t.type === "issue" && !t.returnDate);
  const overdue = active.filter(t => new Date(t.dueDate) < new Date());
  const history = txs.filter(t => t.returnDate);
  const totalFine = txs.reduce((a, t) => a + (t.liveFine ?? 0), 0);

  const suggested = books.filter(b => b.available > 0 && !active.some(t => t.bookId === b.id)).slice(0, 4);

  const borrow = async () => {
    if (!selBook) return;
    try { await apiBorrowBook(selBook.id, 30); await load(); setModal(false); toast("Book borrowed! Return in 30 days."); }
    catch (e: any) { toast(e.message, "err"); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <ToastContainer />

      {/* Welcome banner */}
      <div style={{ background: `linear-gradient(135deg,${C.primaryBg},${C.blueBg})`, border: `1.5px solid ${C.primary}25`, borderRadius: 22, padding: "24px 28px", display: "flex", alignItems: "center", gap: 20, boxShadow: C.shadow, flexWrap: "wrap" }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{user?.avatar}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 24, color: C.text }}>Welcome back, {user?.name.split(" ")[0]}! 📖</h2>
          <p style={{ margin: "4px 0 0", color: C.textMid, fontSize: 13 }}>{user?.department} · {user?.studentCode} · {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        {totalFine > 0 && (
          <div style={{ background: C.redBg, border: `1.5px solid ${C.red}30`, borderRadius: 14, padding: "12px 18px", textAlign: "center" }}>
            <div style={{ color: C.red, fontSize: 20, fontWeight: 800 }}>₹{totalFine}</div>
            <div style={{ color: C.red, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Outstanding Fine</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
        <StatCard icon="📚" label="Books Issued"  value={active.length}   sub="currently active"              color={C.primary} bg={C.primaryBg} />
        <StatCard icon="⚠️" label="Overdue"       value={overdue.length}  sub={overdue.length > 0 ? "pay fines soon" : "you're on track!"} color={overdue.length > 0 ? C.red : C.green} bg={overdue.length > 0 ? C.redBg : C.greenBg} />
        <StatCard icon="📖" label="Total Borrowed" value={txs.length}     sub="all time"                      color={C.amber}   bg={C.amberBg} />
        <StatCard icon="✅" label="Returned"       value={history.length}  sub="books returned"               color={C.teal}    bg={C.tealBg} />
      </div>

      {/* Active loans */}
      {active.length > 0 && (
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 22, boxShadow: C.shadow }}>
          <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 600 }}>📤 Currently Borrowed</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 12 }}>
            {active.map(tx => {
              const book = books.find(b => b.id === tx.bookId);
              const dl = daysLeft(tx.dueDate);
              const ov = dl < 0;
              return (
                <div key={tx.id} style={{ padding: "14px 16px", background: ov ? C.redBg : dl <= 7 ? C.amberBg : C.greenBg, borderRadius: 14, border: `1.5px solid ${ov ? C.red : dl <= 7 ? C.amber : C.green}28` }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 28 }}>{book?.cover ?? "📖"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{tx.bookTitle}</div>
                      <div style={{ color: C.textMid, fontSize: 12, marginBottom: 6 }}>{book?.author}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Badge color={ov ? C.red : dl <= 7 ? C.amber : C.green}>{ov ? `${Math.abs(dl)}d overdue` : dl === 0 ? "Due today" : `${dl}d left`}</Badge>
                        <Badge color={C.blue}>Due: {fmt(tx.dueDate)}</Badge>
                        {(tx.liveFine ?? 0) > 0 && <Badge color={C.red}>Fine: ₹{tx.liveFine}</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested books */}
      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 22, boxShadow: C.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: C.text, fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 600 }}>✨ Available to Borrow</h3>
          <Badge color={C.primary}>{books.filter(b => b.available > 0).length} books</Badge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {suggested.map(book => (
            <div key={book.id} style={{ padding: 14, background: C.inputBg, borderRadius: 14, border: `1px solid ${C.cardBorder}`, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 30 }}>{book.cover}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{book.title}</div>
                <div style={{ color: C.textLight, fontSize: 11, marginBottom: 6 }}>{book.author}</div>
                <Btn variant="primary" style={{ padding: "5px 12px", fontSize: 11, boxShadow: "none" }} onClick={() => { setSelBook(book); setModal(true); }}>Borrow</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && selBook && (
        <Modal title="Borrow Request" onClose={() => setModal(false)}>
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{selBook.cover}</div>
            <h3 style={{ fontFamily: "'Lora',serif", color: C.text, fontSize: 20, marginBottom: 4 }}>{selBook.title}</h3>
            <p style={{ color: C.textMid, fontSize: 14, marginBottom: 20 }}>by {selBook.author}</p>
            <div style={{ background: C.primaryBg, borderRadius: 14, padding: "14px 20px", marginBottom: 20, border: `1px solid ${C.primary}25` }}>
              {[["Borrow date", fmt(new Date().toISOString().split("T")[0])], ["Return by", fmt(addDays(30))], ["Fine rate", "₹10 / day overdue"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: C.textMid, fontSize: 13 }}>{k}</span>
                  <span style={{ color: k === "Fine rate" ? C.red : C.text, fontWeight: 600, fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn variant="success" onClick={borrow}>Confirm Borrow ✓</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
