"use client";
import { useEffect, useState } from "react";
import { C, fmt } from "@/lib/tokens";
import { apiTransactions, apiBooks } from "@/lib/client";
import { StatCard, Badge, Spinner } from "../shared/ui";

export function StudentFines() {
  const [txs, setTxs]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiTransactions().then(t => { setTxs(t); setLoading(false); }); }, []);

  const fineRows = txs.filter(t => (t.liveFine ?? 0) > 0 || (t.returnDate && t.fine > 0));
  const totalFine = txs.reduce((a, t) => a + (t.type === "issue" && !t.returnDate ? (t.liveFine ?? 0) : 0), 0);
  const paid = txs.filter(t => t.returnDate && t.fine > 0).reduce((a, t) => a + t.fine, 0);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>Fines & Dues</h1>
        <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 13 }}>Track your overdue charges</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <StatCard icon="💰" label="Outstanding" value={`₹${totalFine}`} sub="to be paid"    color={C.red}   bg={C.redBg} />
        <StatCard icon="✅" label="Already Paid" value={`₹${paid}`}    sub="cleared"        color={C.green} bg={C.greenBg} />
        <StatCard icon="📋" label="Fine Records" value={fineRows.length} sub="total entries" color={C.amber} bg={C.amberBg} />
      </div>

      {totalFine > 0 && (
        <div style={{ background: C.amberBg, border: `1.5px solid ${C.amber}35`, borderRadius: 16, padding: "16px 20px" }}>
          <div style={{ color: C.amber, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>💡 How to pay your fine</div>
          <div style={{ color: C.textMid, fontSize: 13 }}>Visit the library counter with your student ID. Fines are ₹10 per day overdue. Paying clears your account.</div>
        </div>
      )}

      {fineRows.length === 0 ? (
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: "48px 24px", textAlign: "center", boxShadow: C.shadow }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ color: C.green, fontSize: 16, fontWeight: 700 }}>No fines! You&apos;re all clear.</div>
          <div style={{ color: C.textLight, fontSize: 13, marginTop: 4 }}>Keep returning books on time to stay fine-free.</div>
        </div>
      ) : (
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, overflow: "hidden", boxShadow: C.shadow }}>
          <div style={{ padding: "12px 18px", background: C.inputBg, borderBottom: `1.5px solid ${C.cardBorder}`, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
            {["Book", "Issued", "Due Date", "Days OD", "Fine"].map(h => (
              <div key={h} style={{ color: C.textLight, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</div>
            ))}
          </div>
          {fineRows.map((tx, i) => {
            const lf = tx.returnDate ? tx.fine : (tx.liveFine ?? 0);
            const od = tx.returnDate
              ? Math.max(0, Math.floor((new Date(tx.returnDate).getTime() - new Date(tx.dueDate).getTime()) / 86400000))
              : Math.max(0, Math.floor((Date.now() - new Date(tx.dueDate).getTime()) / 86400000));
            return (
              <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 18px", borderBottom: `1px solid ${C.cardBorder}`, alignItems: "center", background: i % 2 === 0 ? "#fff" : C.inputBg }}>
                <div>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{tx.bookTitle}</div>
                  <Badge color={tx.returnDate ? C.green : C.red}>{tx.returnDate ? "Returned" : "Active"}</Badge>
                </div>
                <div style={{ color: C.textMid, fontSize: 12 }}>{fmt(tx.date)}</div>
                <div style={{ color: C.red, fontSize: 12, fontWeight: 600 }}>{fmt(tx.dueDate)}</div>
                <div style={{ color: C.red, fontSize: 13, fontWeight: 700 }}>{od}d</div>
                <div style={{ color: C.red, fontSize: 14, fontWeight: 800 }}>₹{lf}</div>
              </div>
            );
          })}
          <div style={{ padding: "14px 18px", background: C.redBg, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1.5px solid ${C.red}25` }}>
            <span style={{ color: C.red, fontWeight: 700, fontSize: 14 }}>Total Outstanding</span>
            <span style={{ color: C.red, fontWeight: 800, fontSize: 20, fontFamily: "'Lora',serif" }}>₹{totalFine}</span>
          </div>
        </div>
      )}
    </div>
  );
}
