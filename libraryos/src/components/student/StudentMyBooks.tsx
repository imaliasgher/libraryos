"use client";
import { useEffect, useState } from "react";
import { C, fmt, daysLeft } from "@/lib/tokens";
import { apiTransactions, apiBooks } from "@/lib/client";
import { StatCard, Badge, Spinner } from "../shared/ui";

export function StudentMyBooks() {
  const [txs, setTxs]     = useState<any[]>([]);
  const [books, setBooks]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]     = useState<"active" | "overdue" | "history">("active");

  useEffect(() => {
    Promise.all([apiTransactions(), apiBooks()]).then(([t, b]) => { setTxs(t); setBooks(b); setLoading(false); });
  }, []);

  const active  = txs.filter(t => t.type === "issue" && !t.returnDate);
  const overdue = active.filter(t => new Date(t.dueDate) < new Date());
  const history = txs.filter(t => t.returnDate).reverse();
  const totalFine = txs.reduce((a, t) => a + (t.liveFine ?? 0), 0);

  const rows = tab === "active" ? active : tab === "overdue" ? overdue : history;

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>My Books</h1>
        <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 13 }}>Your borrowing history and active loans</p>
      </div>

      {totalFine > 0 && (
        <div style={{ background: C.redBg, border: `1.5px solid ${C.red}35`, borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: C.red, fontWeight: 700, fontSize: 15 }}>⚠️ Outstanding Fine</div>
            <div style={{ color: C.textMid, fontSize: 13, marginTop: 2 }}>Please pay at the library counter to resume borrowing.</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.red, fontFamily: "'Lora',serif" }}>₹{totalFine}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <StatCard icon="📖" label="Borrowed"  value={active.length}  sub={`${overdue.length} overdue`}              color={C.primary} bg={C.primaryBg} />
        <StatCard icon="⏰" label="Overdue"   value={overdue.length} sub={overdue.length > 0 ? "pay fines" : "all good!"} color={overdue.length > 0 ? C.red : C.green} bg={overdue.length > 0 ? C.redBg : C.greenBg} />
        <StatCard icon="📚" label="All Time"  value={txs.length}     sub="total borrows"                            color={C.amber}   bg={C.amberBg} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.inputBg, borderRadius: 12, padding: 4, border: `1.5px solid ${C.inputBorder}`, width: "fit-content", gap: 2 }}>
        {([["active", `Active (${active.length})`], ["overdue", `Overdue (${overdue.length})`], ["history", `History (${history.length})`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: "8px 18px", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all 0.2s", background: tab === k ? "#fff" : "transparent", color: tab === k ? C.primaryDark : C.textMid, boxShadow: tab === k ? C.shadow : "none" }}>{l}</button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: "48px 24px", textAlign: "center", boxShadow: C.shadow }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ color: C.textMid, fontSize: 15, fontWeight: 600 }}>Nothing here yet</div>
          <div style={{ color: C.textLight, fontSize: 13, marginTop: 4 }}>
            {tab === "active" ? "Browse the catalogue to borrow a book!" : tab === "overdue" ? "Great! No overdue books." : "Your return history is empty."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map(tx => {
            const book = books.find(b => b.id === tx.bookId);
            const dl = daysLeft(tx.dueDate);
            const ov = !tx.returnDate && dl < 0;
            return (
              <div key={tx.id} style={{ background: ov ? C.redBg : C.cardBg, border: `1.5px solid ${ov ? C.red : C.cardBorder}`, borderRadius: 16, padding: "18px 20px", display: "flex", gap: 16, alignItems: "center", boxShadow: C.shadow }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{book?.cover ?? "📖"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{tx.bookTitle}</div>
                  <div style={{ color: C.textMid, fontSize: 12, marginBottom: 8 }}>{book?.author}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge color={C.blue}>Issued: {fmt(tx.date)}</Badge>
                    <Badge color={ov ? C.red : C.amber}>Due: {fmt(tx.dueDate)}</Badge>
                    {tx.returnDate && <Badge color={C.green}>Returned: {fmt(tx.returnDate)}</Badge>}
                    {(tx.liveFine ?? 0) > 0 && <Badge color={C.red}>Fine: ₹{tx.liveFine}</Badge>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {!tx.returnDate && (
                    <div style={{ color: ov ? C.red : dl <= 7 ? C.amber : C.green, fontWeight: 700, fontSize: 16, fontFamily: "'Lora',serif" }}>
                      {ov ? `${Math.abs(dl)}d overdue` : dl === 0 ? "Due today" : `${dl}d left`}
                    </div>
                  )}
                  {tx.returnDate && <Badge color={C.green}>Returned ✓</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
