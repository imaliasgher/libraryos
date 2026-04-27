"use client";
import { useEffect, useState } from "react";
import { C, fmt, daysLeft } from "@/lib/tokens";
import { apiTransactions, apiBooks } from "@/lib/client";
import { useAuth } from "../shared/AuthProvider";
import { StatCard, Badge, Spinner } from "../shared/ui";

export function StudentDashboard() {
  const { user } = useAuth();
  const [txs, setTxs]     = useState<any[]>([]);
  const [books, setBooks]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Welcome banner */}
      <div style={{ background: `linear-gradient(135deg,#fff8f0,#fff)`, border: `2px solid ${C.primary}25`, borderRadius: 24, padding: "28px", display: "flex", alignItems: "center", gap: 24, boxShadow: C.shadow, flexWrap: "wrap" }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: `0 8px 24px ${C.primary}30` }}>{user?.avatar}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>Hi, {user?.name.split(" ")[0]}! 👋</h2>
          <p style={{ margin: "4px 0 0", color: C.textMid, fontSize: 15, fontWeight: 600 }}>We love having you in our library! ✨</p>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <Badge color={C.blue}>{user?.department}</Badge>
            <Badge color={C.teal}>Level {user?.year}</Badge>
          </div>
        </div>
        {totalFine > 0 && (
          <div style={{ background: C.redBg, border: `1.5px solid ${C.red}30`, borderRadius: 14, padding: "12px 18px", textAlign: "center" }}>
            <div style={{ color: C.red, fontSize: 20, fontWeight: 800 }}>₹{totalFine}</div>
            <div style={{ color: C.red, fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Outstanding Fine</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 20 }}>
        <StatCard icon="🎒" label="My Reading Books"  value={active.length}   sub="books with me"     color={C.primary} bg={C.primaryBg} />
        <StatCard icon={overdue.length > 0 ? "⏰" : "⭐"} label={overdue.length > 0 ? "Return soon!" : "Star Reader"} value={overdue.length > 0 ? overdue.length : "Yes!"} sub={overdue.length > 0 ? "please bring back" : "all turned in!"} color={overdue.length > 0 ? C.red : C.green} bg={overdue.length > 0 ? C.redBg : C.greenBg} />
        <StatCard icon="📚" label="Stories Read" value={txs.length}     sub="total adventures" color={C.amber}   bg={C.amberBg} />
        <StatCard icon="🎉" label="Return History" value={history.length}  sub="well done!"       color={C.teal}    bg={C.tealBg} />
      </div>

      {/* Active loans */}
      {active.length > 0 && (
        <div style={{ background: C.cardBg, border: `2px solid ${C.cardBorder}`, borderRadius: 24, padding: 24, boxShadow: C.shadow }}>
          <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 18, fontFamily: "'Lora',serif", fontWeight: 700 }}>🏠 Books at Home</h3>
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
      <div style={{ background: C.cardBg, border: `2px solid ${C.cardBorder}`, borderRadius: 24, padding: 24, boxShadow: C.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: C.text, fontSize: 18, fontFamily: "'Lora',serif", fontWeight: 700 }}>✨ Find your next story!</h3>
          <Badge color={C.primary}>{books.filter(b => b.available > 0).length} books</Badge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {suggested.map(book => (
            <div key={book.id} style={{ padding: 14, background: C.inputBg, borderRadius: 14, border: `1px solid ${C.cardBorder}`, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 30 }}>{book.cover}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{book.title}</div>
                <div style={{ color: C.textLight, fontSize: 11, marginBottom: 6 }}>{book.author}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
