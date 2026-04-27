"use client";
import { useEffect, useState } from "react";
import { C, fmt } from "@/lib/tokens";
import { apiDashboard, apiBooks, apiStudents, apiTransactions } from "@/lib/client";
import { Badge, Spinner, Btn } from "../shared/ui";

type Timeframe = "daily" | "monthly" | "yearly" | "all";

export function AdminReports() {
  const [data, setData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("all");

  useEffect(() => {
    Promise.all([apiDashboard(), apiBooks(), apiStudents(), apiTransactions()]).then(
      ([dash, books, students, txs]) => setData({ dash, books, students, txs })
    );
  }, []);

  if (!data) return <Spinner />;
  const { dash, books, students, txs } = data;
  const { stats } = dash;

  // ── FILTER DATA BY TIMEFRAME ──────────────────────────────────────────────
  const now = new Date();
  const filteredTxs = txs.filter((t: any) => {
    if (timeframe === "all") return true;
    const d = new Date(t.date);
    if (timeframe === "daily") return d.toDateString() === now.toDateString();
    if (timeframe === "monthly") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (timeframe === "yearly") return d.getFullYear() === now.getFullYear();
    return true;
  });

  const returnedCount = filteredTxs.filter((t: any) => t.returnDate).length;
  const issuedCount   = filteredTxs.filter((t: any) => t.type === "issue").length;
  const activeCount   = filteredTxs.filter((t: any) => t.type === "issue" && !t.returnDate).length;
  const fineTotal     = filteredTxs.reduce((acc: number, t: any) => acc + (t.returnDate ? t.fine : 0), 0);

  // ── INSIGHTS CALCULATION ──────────────────────────────────────────────────
  // Top Books
  const topBooks = [...books]
    .sort((a: any, b: any) => filteredTxs.filter((t: any) => t.bookId === b.id).length - filteredTxs.filter((t: any) => t.bookId === a.id).length)
    .slice(0, 5)
    .filter(b => filteredTxs.some((t: any) => t.bookId === b.id));

  // Top Members
  const topStudents = [...students]
    .sort((a: any, b: any) => filteredTxs.filter((t: any) => t.studentId === b.id).length - filteredTxs.filter((t: any) => t.studentId === a.id).length)
    .slice(0, 5)
    .filter(s => filteredTxs.some((t: any) => t.studentId === s.id));

  // Busy Days (Insights for bottlenecks)
  const dayCounts: Record<string, number> = {};
  filteredTxs.forEach((t: any) => {
    const day = new Date(t.date).toLocaleDateString("en-US", { weekday: "long" });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  const busyDay = Object.entries(dayCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "No data";

  // ── CSV EXPORT ────────────────────────────────────────────────────────────
  const downloadCSV = () => {
    const headers = ["Date", "Type", "Book", "Member", "MemberID", "Due Date", "Return Date", "Fine"];
    const rows = filteredTxs.map((t: any) => [
      t.date, t.type, t.bookTitle, t.studentName, t.studentCode, t.dueDate, t.returnDate || "pending", t.fine
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `library_report_${timeframe}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const timeframeLabels: Record<Timeframe, string> = { all: "Entire History", daily: "Today", monthly: "This Month", yearly: "This Year" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <style>{`
        @media (max-width: 640px) {
          .rep-two-col { grid-template-columns: 1fr !important; }
          .rep-header { flex-direction: column; align-items: flex-start !important; gap: 16px; }
        }
      `}</style>
      
      <div className="rep-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 30, color: C.text, fontWeight: 700 }}>Library Insights ✨</h1>
          <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 14 }}>Tracking growth and identifying bottlenecks</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: C.inputBg, border: `1.5px solid ${C.inputBorder}`, padding: 4, borderRadius: 12, display: "flex" }}>
            {(["daily", "monthly", "yearly", "all"] as Timeframe[]).map((t) => (
              <button key={t} onClick={() => setTimeframe(t)}
                style={{ padding: "6px 12px", borderRadius: 8, background: timeframe === t ? C.primary : "transparent", color: timeframe === t ? "#fff" : C.textMid, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <Btn onClick={downloadCSV} style={{ background: C.text, color: "#fff", borderRadius: 12 }}>📥 Download CSV</Btn>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        <ReportStat label="Books Issued" v={issuedCount} icon="📤" color={C.primary} sub={timeframeLabels[timeframe]} />
        <ReportStat label="Books Returned" v={returnedCount} icon="📥" color={C.green} sub={timeframeLabels[timeframe]} />
        <ReportStat label="Fines Collected" v={`₹${fineTotal}`} icon="💰" color={C.amber} sub="From returned items" />
        <ReportStat label="Busiest Day" v={busyDay} icon="🔥" color={C.red} sub="Peak traffic period" />
      </div>

      {/* Main Insights Grid */}
      <div className="rep-two-col" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        
        {/* Left: Popularity & Data */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Most Borrowed */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 20, padding: 24, boxShadow: C.shadow }}>
            <h3 style={{ margin: "0 0 20px", color: C.text, fontSize: 18, fontFamily: "'Lora',serif", fontWeight: 700 }}>Most Borrowed Stories</h3>
            {topBooks.length === 0 ? <p style={{ color: C.textLight, fontSize: 14 }}>No data for this period.</p> : topBooks.map((book: any, i: number) => {
              const count = filteredTxs.filter((t: any) => t.bookId === book.id).length;
              return (
                <div key={book.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ color: C.textLight, fontSize: 12, width: 20, fontWeight: 800 }}>#{i + 1}</span>
                      <span style={{ fontSize: 18 }}>{book.cover}</span>
                      <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{book.title}</span>
                    </div>
                    <span style={{ color: C.primary, fontSize: 14, fontWeight: 800 }}>{count}×</span>
                  </div>
                  <div style={{ height: 6, background: C.primaryBg, borderRadius: 10, marginLeft: 44, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / (filteredTxs.length || 1)) * 100}%`, background: `linear-gradient(90deg,${C.primary},${C.primaryDark})`, borderRadius: 10 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 20, padding: 24, boxShadow: C.shadow }}>
            <h3 style={{ margin: "0 0 20px", color: C.text, fontSize: 18, fontFamily: "'Lora',serif", fontWeight: 700 }}>Bottleneck Discovery</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <InsightCard label="Overdue Concentration" value={`${issuedCount > 0 ? Math.round((activeCount / issuedCount) * 100) : 0}%`} sub="Issued books pending return" icon="⌛" color={C.red} />
              <InsightCard label="Retention Rate" value={`${students.length > 0 ? Math.round((topStudents.length / students.length) * 100) : 0}%`} sub="Regular vs Total readers" icon="📈" color={C.green} />
            </div>
          </div>
        </div>

        {/* Right: Top Readers & Stock */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 20, padding: 24, boxShadow: C.shadow }}>
            <h3 style={{ margin: "0 0 20px", color: C.text, fontSize: 18, fontFamily: "'Lora',serif", fontWeight: 700 }}>Star Readers ⭐</h3>
            {topStudents.length === 0 ? <p style={{ color: C.textLight, fontSize: 14 }}>Explore reading habits soon.</p> : topStudents.map((s: any, i: number) => {
              const count = filteredTxs.filter((t: any) => t.studentId === s.id).length;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.greenBg, color: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>{s.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                    <div style={{ color: C.textLight, fontSize: 11 }}>Read {count} books {timeframeLabels[timeframe]}</div>
                  </div>
                  {i === 0 && <span style={{ fontSize: 20 }}>👑</span>}
                </div>
              );
            })}
          </div>

          <div style={{ background: C.redBg, border: `1.5px solid ${C.red}25`, borderRadius: 20, padding: 24 }}>
            <h3 style={{ margin: "0 0 14px", color: C.red, fontSize: 16, fontWeight: 800 }}>📦 Inventory Bottlenecks</h3>
            {dash.lowStock.slice(0, 3).map((b: any) => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, background: "#fff", padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.red}15` }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{b.title}</span>
                <span style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>{b.available} left</span>
              </div>
            ))}
            <div style={{ marginTop: 12, color: C.red, fontSize: 11, fontWeight: 600, opacity: 0.8 }}>Demand is exceeding supply for these titles. Consider ordering more copies.</div>
          </div>
        </div>

      </div>
    </div>
  );
}

function ReportStat({ label, v, icon, color, sub }: any) {
  return (
    <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 20, padding: 22, boxShadow: C.shadow }}>
      <div style={{ fontSize: 24, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color, fontFamily: "'Lora',serif", lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: 1, marginTop: 8, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.textMid, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function InsightCard({ label, value, sub, icon, color }: any) {
  return (
    <div style={{ background: C.pageBg, padding: 16, borderRadius: 16, border: `1px solid ${C.cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textMid, marginTop: 2 }}>{sub}</div>
    </div>
  );
}
