"use client";
import { useEffect, useState } from "react";
import { C, fmt, calcFine } from "@/lib/tokens";
import { apiDashboard, apiBooks, apiStudents, apiTransactions } from "@/lib/client";
import { Badge, StatCard, Spinner } from "../shared/ui";

export function AdminReports() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    Promise.all([apiDashboard(), apiBooks(), apiStudents(), apiTransactions()]).then(
      ([dash, books, students, txs]) => setData({ dash, books, students, txs })
    );
  }, []);

  if (!data) return <Spinner />;
  const { dash, books, students, txs } = data;
  const { stats } = dash;

  const returned = txs.filter((t: any) => t.returnDate).length;
  const util = Math.round(((stats.totalBooks - stats.totalAvailable) / Math.max(1, stats.totalBooks)) * 100);

  const topBooks = [...books]
    .sort((a: any, b: any) => txs.filter((t: any) => t.bookId === b.id).length - txs.filter((t: any) => t.bookId === a.id).length)
    .slice(0, 5);
  const topStudents = [...students]
    .sort((a: any, b: any) => txs.filter((t: any) => t.studentId === b.id).length - txs.filter((t: any) => t.studentId === a.id).length)
    .slice(0, 5);
  const mB = Math.max(...topBooks.map((b: any) => txs.filter((t: any) => t.bookId === b.id).length), 1);
  const mS = Math.max(...topStudents.map((s: any) => txs.filter((t: any) => t.studentId === s.id).length), 1);

  const summary = [
    { l: "Books Returned",  v: returned,            icon: "📥", color: C.green,   bg: C.greenBg },
    { l: "Active Loans",    v: stats.activeIssues,  icon: "📤", color: C.amber,   bg: C.amberBg },
    { l: "Overdue",         v: stats.overdueCount,  icon: "⏰", color: C.red,     bg: C.redBg },
    { l: "Fines Pending",   v: `₹${stats.totalFines}`, icon: "💰", color: C.primary, bg: C.primaryBg },
    { l: "Utilization",     v: `${util}%`,          icon: "📊", color: C.blue,    bg: C.blueBg },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>Reports & Analytics</h1>
        <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 13 }}>Library performance overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(148px,1fr))", gap: 14 }}>
        {summary.map(s => (
          <div key={s.l} style={{ background: s.bg, border: `1.5px solid ${s.color}28`, borderRadius: 16, padding: "16px 18px", boxShadow: C.shadow }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'Lora',serif" }}>{s.v}</div>
            <div style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 3, fontWeight: 700 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Most Borrowed */}
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 22, boxShadow: C.shadow }}>
          <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 600 }}>Most Borrowed Books</h3>
          {topBooks.map((book: any, i: number) => {
            const c = txs.filter((t: any) => t.bookId === book.id).length;
            return (
              <div key={book.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: C.textLight, fontSize: 11, width: 16, textAlign: "right", fontWeight: 700 }}>#{i + 1}</span>
                    <span style={{ fontSize: 15 }}>{book.cover}</span>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{book.title}</span>
                  </div>
                  <span style={{ color: C.primary, fontSize: 13, fontWeight: 700 }}>{c}×</span>
                </div>
                <div style={{ height: 5, background: C.primaryBg, borderRadius: 10, marginLeft: 38, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(c / mB) * 100}%`, background: `linear-gradient(90deg,${C.primary},${C.primaryDark})`, borderRadius: 10 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Most Active Students */}
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 22, boxShadow: C.shadow }}>
          <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 600 }}>Most Active Members</h3>
          {topStudents.map((s: any, i: number) => {
            const c = txs.filter((t: any) => t.studentId === s.id).length;
            return (
              <div key={s.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: C.textLight, fontSize: 11, width: 16, textAlign: "right", fontWeight: 700 }}>#{i + 1}</span>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#2e7d58" }}>{s.avatar}</div>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                  </div>
                  <span style={{ color: C.green, fontSize: 13, fontWeight: 700 }}>{c} books</span>
                </div>
                <div style={{ height: 5, background: C.greenBg, borderRadius: 10, marginLeft: 40, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(c / mS) * 100}%`, background: `linear-gradient(90deg,${C.green},#3a9068)`, borderRadius: 10 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Low stock */}
      <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 22, boxShadow: C.shadow }}>
        <h3 style={{ margin: "0 0 14px", color: C.text, fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 600 }}>📦 Stock Alerts</h3>
        {dash.lowStock.length === 0
          ? <p style={{ color: C.green, fontWeight: 600 }}>✅ All books fully stocked.</p>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
              {dash.lowStock.map((b: any) => (
                <div key={b.id} style={{ display: "flex", gap: 12, padding: "12px 14px", background: C.amberBg, border: `1.5px solid ${C.amber}28`, borderRadius: 12 }}>
                  <span style={{ fontSize: 22 }}>{b.cover}</span>
                  <div>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{b.title}</div>
                    <div style={{ color: b.available === 0 ? C.red : C.amber, fontSize: 12, fontWeight: 600 }}>{b.available === 0 ? "Out of stock" : `${b.available}/${b.total} left`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
