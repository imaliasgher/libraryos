"use client";
import { useEffect, useState } from "react";
import { C, fmt, calcFine } from "@/lib/tokens";
import { apiTransactions, apiReturnBook } from "@/lib/client";
import { Badge, Btn, Spinner, useToast } from "../shared/ui";

export function AdminTransactions() {
  const [txs, setTxs]         = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const { toast, ToastContainer } = useToast();

  const load = async () => { setTxs(await apiTransactions()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const returnBook = async (tx: any) => {
    try { await apiReturnBook(tx.id); await load(); toast("Book returned!"); } catch (e: any) { toast(e.message, "err"); }
  };

  const filtered = txs.filter(t => {
    const ms = t.bookTitle.toLowerCase().includes(search.toLowerCase()) || t.studentName.toLowerCase().includes(search.toLowerCase()) || t.studentCode.includes(search);
    const ov = !t.returnDate && new Date(t.dueDate) < new Date();
    const mf = filter === "all"
      || (filter === "active"   && t.type === "issue" && !t.returnDate)
      || (filter === "overdue"  && ov)
      || (filter === "returned" && t.returnDate)
      || (filter === "fines"    && (t.liveFine > 0));
    return ms && mf;
  });

  const overdueCount = txs.filter(t => t.type === "issue" && !t.returnDate && new Date(t.dueDate) < new Date()).length;
  const tabs = [{ k: "all", l: "All" }, { k: "active", l: "Active" }, { k: "overdue", l: `⚠️ Overdue (${overdueCount})` }, { k: "returned", l: "Returned" }, { k: "fines", l: "With Fines" }];

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ToastContainer />
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>Transactions</h1>
        <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 13 }}>{txs.length} total records · {overdueCount} overdue</p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search book or student…"
          style={{ background: C.cardBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none", flex: 1, minWidth: 180, fontFamily: "inherit" }} />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => setFilter(t.k)}
              style={{ background: filter === t.k ? C.primary : C.cardBg, border: `1.5px solid ${filter === t.k ? C.primary : C.inputBorder}`, color: filter === t.k ? "#fff" : C.textMid, borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, overflow: "hidden", boxShadow: C.shadow }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 1fr", padding: "11px 18px", borderBottom: `1.5px solid ${C.cardBorder}`, background: C.inputBg }}>
          {["Book", "Student", "Issued", "Due", "Status", "Fine", "Action"].map(h => (
            <div key={h} style={{ color: C.textLight, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ padding: "36px 18px", textAlign: "center", color: C.textLight }}>No transactions found.</div>}
        {filtered.map((tx, i) => {
          const ov = tx.type === "issue" && !tx.returnDate && new Date(tx.dueDate) < new Date();
          return (
            <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 1fr", padding: "12px 18px", borderBottom: `1px solid ${C.cardBorder}`, alignItems: "center", background: ov ? C.redBg : i % 2 === 0 ? "#fff" : C.inputBg }}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{tx.bookTitle}</div>
              <div>
                <div style={{ color: C.text, fontSize: 13 }}>{tx.studentName}</div>
                <div style={{ color: C.textLight, fontSize: 11 }}>{tx.studentCode}</div>
              </div>
              <div style={{ color: C.textMid, fontSize: 12 }}>{fmt(tx.date)}</div>
              <div style={{ color: ov ? C.red : C.textMid, fontSize: 12, fontWeight: ov ? 700 : 400 }}>{fmt(tx.dueDate)}</div>
              <Badge color={tx.returnDate ? C.green : ov ? C.red : C.amber}>{tx.returnDate ? "Returned" : ov ? "Overdue" : "Active"}</Badge>
              <div style={{ color: tx.liveFine > 0 ? C.red : C.textLight, fontWeight: tx.liveFine > 0 ? 700 : 400, fontSize: 13 }}>{tx.liveFine > 0 ? `₹${tx.liveFine}` : "—"}</div>
              <div>
                {!tx.returnDate && tx.type === "issue" && <Btn variant="success" style={{ padding: "6px 11px", fontSize: 11, boxShadow: "none" }} onClick={() => returnBook(tx)}>Return</Btn>}
                {tx.returnDate && <span style={{ color: C.textLight, fontSize: 12 }}>{fmt(tx.returnDate)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
