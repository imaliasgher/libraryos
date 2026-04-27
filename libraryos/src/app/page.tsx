"use client";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/components/shared/AuthProvider";
import { LoginScreen } from "@/components/shared/LoginScreen";
import { Shell } from "@/components/shared/Shell";
import { Spinner } from "@/components/shared/ui";
import { C } from "@/lib/tokens";

// Admin pages
import { AdminDashboard }    from "@/components/admin/AdminDashboard";
import { AdminBooks }        from "@/components/admin/AdminBooks";
import { AdminStudents }     from "@/components/admin/AdminStudents";
import { AdminTransactions } from "@/components/admin/AdminTransactions";
import { AdminReports }      from "@/components/admin/AdminReports";
import { AdminScanner }      from "@/components/admin/AdminScanner";
import { AdminSettings }     from "@/components/admin/AdminSettings";

// Student pages
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { StudentCatalogue } from "@/components/student/StudentCatalogue";
import { StudentMyBooks }   from "@/components/student/StudentMyBooks";
import { StudentFines }     from "@/components/student/StudentFines";
import { StudentProfile }   from "@/components/student/StudentProfile";

// ── Admin App ──────────────────────────────────────────────────────────────
function AdminApp() {
  const [page, setPage] = useState("dashboard");

  const nav = [
    { key: "dashboard",    icon: "🏠", label: "Dashboard" },
    { key: "books",        icon: "📚", label: "Book Catalogue" },
    { key: "students",     icon: "🎓", label: "Members" },
    { key: "transactions", icon: "🔄", label: "Issue / Return" },
    { key: "scanner",      icon: "📷", label: "QR Scanner" },
    { key: "reports",      icon: "📊", label: "Reports" },
    { key: "settings",     icon: "⚙️", label: "Settings" },
  ];

  const sidebarBottom = (
    <div style={{ padding: "0 14px 12px", marginTop: 24 }}>
      <div style={{ background: C.primaryBg, border: `1.5px solid ${C.primary}22`, borderRadius: 14, padding: "12px 14px" }}>
        <div style={{ color: C.textLight, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>Admin Controls</div>
        <div style={{ color: C.textMid, fontSize: 11 }}>Manage books, students, and transactions from the sidebar.</div>
      </div>
    </div>
  );

  return (
    <Shell nav={nav} page={page} setPage={setPage} sidebarBottom={sidebarBottom}>
      {page === "dashboard"    && <AdminDashboard setPage={setPage} />}
      {page === "books"        && <AdminBooks />}
      {page === "students"     && <AdminStudents />}
      {page === "transactions" && <AdminTransactions />}
      {page === "reports"      && <AdminReports />}
      {page === "scanner"      && <AdminScanner />}
      {page === "settings"     && <AdminSettings />}
    </Shell>
  );
}

// ── Student App ────────────────────────────────────────────────────────────
function StudentApp() {
  const [page, setPage] = useState("dashboard");

  const nav = [
    { key: "dashboard", icon: "🏠", label: "My Library" },
    { key: "catalogue", icon: "📚", label: "Story Room" },
    { key: "mybooks",   icon: "📖", label: "My Bag" },
    { key: "fines",     icon: "💰", label: "Reminders" },
    { key: "profile",   icon: "👤", label: "My Profile" },
  ];

  const sidebarBottom = (
    <div style={{ padding: "0 14px 12px" }}>
      <div style={{ background: C.greenBg, border: `1.5px solid ${C.green}22`, borderRadius: 14, padding: "12px 14px" }}>
        <div style={{ color: C.textLight, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>Quick Info</div>
        <div style={{ color: C.textMid, fontSize: 11 }}>Fine rate: ₹10/day overdue. Return books on time to avoid charges!</div>
      </div>
    </div>
  );

  return (
    <Shell nav={nav} page={page} setPage={setPage} sidebarBottom={sidebarBottom}>
      {page === "dashboard" && <StudentDashboard />}
      {page === "catalogue" && <StudentCatalogue />}
      {page === "mybooks"   && <StudentMyBooks />}
      {page === "fines"     && <StudentFines />}
      {page === "profile"   && <StudentProfile />}
    </Shell>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
function AppInner() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.pageBg }}>
      <Spinner />
    </div>
  );

  if (!user) return <LoginScreen />;
  if (user.role === "admin") return <AdminApp />;
  return <StudentApp />;
}

export default function Page() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
