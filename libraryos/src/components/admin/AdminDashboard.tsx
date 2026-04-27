"use client";
import { useEffect, useState } from "react";
import { C, fmt, ACCENT_COLORS } from "@/lib/tokens";
import { apiDashboard, apiReturnBook } from "@/lib/client";
import { StatCard, Badge, Spinner, Btn, useToast } from "../shared/ui";

export function AdminDashboard({ setPage }: { setPage: (p: string) => void }) {
  const [data, setData] = useState<any>(null);
  const { toast, ToastContainer } = useToast();

  const load = () => apiDashboard().then(setData);
  useEffect(() => { load(); }, []);

  if (!data) return <Spinner />;

  const returnBook = async (id: number) => {
    try { await apiReturnBook(id); await load(); toast("Book returned!"); }
    catch (e: any) { toast(e.message, "err"); }
  };

  const { stats, recentTransactions, overdue, genreCounts, lowStock } = data;
  const topGenres = Object.entries(genreCounts as Record<string, number>).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
  const maxG = (topGenres[0]?.[1] as number) ?? 1;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <ToastContainer />
      <style>{`
        @media (max-width: 640px) {
          .dash-stat-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .dash-main-grid { grid-template-columns: 1fr !important; }
          .dash-bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 30, color: C.text, fontWeight: 700 }}>{greeting}, Librarian! 👋</h1>
          <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 14 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setPage("scanner")}      style={{ padding: "10px 16px", background: C.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>✨ Scan Book</button>
          <button onClick={() => setPage("transactions")} style={{ padding: "10px 16px", background: "#fff", border: `1.5px solid ${C.cardBorder}`, color: C.text, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🔄 Issue / Return</button>
          <button onClick={() => setPage("students")}     style={{ padding: "10px 16px", background: "#fff", border: `1.5px solid ${C.cardBorder}`, color: C.text, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🧒 New Member</button>
        </div>
      </div>

      <div className="dash-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatCard icon="📚" label="Total Books"   value={stats.totalBooks}     sub={`${stats.totalAvailable} copies available`}                                          color={C.primary} bg={C.primaryBg} />
        <StatCard icon="🎓" label="Active Members" value={stats.totalStudents}   sub={`${stats.totalStudents} registered`}                                               color={C.green}   bg={C.greenBg} />
        <StatCard icon="📖" label="Books Borrowed" value={stats.activeIssues}    sub={`${stats.overdueCount > 0 ? stats.overdueCount + " overdue" : "none overdue"}`}  color={C.amber}   bg={C.amberBg} />
        <StatCard icon="❗" label="Overdue Books"  value={stats.overdueCount}    sub={stats.totalFines > 0 ? `₹${stats.totalFines} fines pending` : "all on track"}     color={C.red}     bg={C.redBg} />
      </div>

      <div className="dash-main-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
        
        {/* Main Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Recent activity */}
          <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 22, boxShadow: C.shadow }}>
            <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 600 }}>Recent Activity</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentTransactions.map((tx: any) => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", background: C.inputBg, borderRadius: 11, border: `1px solid ${C.cardBorder}` }}>
                  <span style={{ fontSize: 17 }}>{tx.type === "issue" && !tx.returnDate ? "📤" : "📥"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.bookTitle}</div>
                    <div style={{ color: C.textLight, fontSize: 11 }}>{tx.studentName} · {fmt(tx.date)}</div>
                  </div>
                  {tx.type === "issue" && !tx.returnDate ? (
                    <button onClick={() => returnBook(tx.id)} style={{ padding: "5px 12px", background: C.greenBg, color: C.green, border: `1px solid ${C.green}30`, borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Return</button>
                  ) : (
                    <Badge color={C.green}>Returned</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="dash-bottom-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Genre chart */}
            <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 22, boxShadow: C.shadow }}>
              <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 600 }}>Collection by Genre</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {topGenres.map(([genre, count], i) => (
                  <div key={genre}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ color: C.textMid, fontSize: 13 }}>{genre}</span>
                      <span style={{ color: ACCENT_COLORS[i], fontSize: 12, fontWeight: 700 }}>{count as number}</span>
                    </div>
                    <div style={{ height: 6, background: `${ACCENT_COLORS[i]}1a`, borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${((count as number) / maxG) * 100}%`, background: ACCENT_COLORS[i], borderRadius: 10, transition: "width 0.7s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low stock */}
            {lowStock.length > 0 && (
              <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 22, boxShadow: C.shadow }}>
                <h3 style={{ margin: "0 0 14px", color: C.text, fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 600 }}>⚠️ Low Stock Items</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {lowStock.slice(0, 4).map((b: any) => (
                    <div key={b.id} style={{ display: "flex", gap: 12, padding: "10px 12px", background: C.amberBg, border: `1px solid ${C.amber}28`, borderRadius: 12 }}>
                      <span style={{ fontSize: 20 }}>{b.cover}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: C.text, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</div>
                        <div style={{ color: b.available === 0 ? C.red : C.amber, fontSize: 11, fontWeight: 600 }}>{b.available === 0 ? "Out of stock" : `${b.available}/${b.total} left`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Overdue Sidebar Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {overdue.length > 0 ? (
            <div style={{ background: C.redBg, border: `1.5px solid ${C.red}35`, borderRadius: 18, padding: "20px 22px", boxShadow: C.shadow }}>
              <div style={{ color: C.red, fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚠️</span> Overdue Alert ({overdue.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {overdue.map((tx: any) => {
                  const days = Math.floor((Date.now() - new Date(tx.dueDate).getTime()) / 86400000);
                  return (
                    <div key={tx.id} style={{ background: "#fff", borderRadius: 12, padding: "14px", border: `1px solid ${C.red}20`, boxShadow: "0 2px 8px rgba(200,0,0,0.03)" }}>
                      <div style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{tx.bookTitle}</div>
                      <div style={{ color: C.textLight, fontSize: 12, marginBottom: 10 }}>{tx.studentName}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px dashed ${C.red}25` }}>
                        <div style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>{days}d overdue</div>
                        <div style={{ color: C.textMid, fontSize: 11 }}>Fine: ₹{days * 10}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ background: C.greenBg, border: `1.5px solid ${C.green}35`, borderRadius: 18, padding: "20px 22px", textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🎉</div>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>All clear!</div>
              <div style={{ color: C.textMid, fontSize: 12, marginTop: 4 }}>No overdue books right now.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
