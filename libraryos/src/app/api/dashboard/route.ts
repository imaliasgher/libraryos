// src/app/api/dashboard/route.ts
import { prisma } from "@/lib/prisma";
import { getSession, calcFine } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  const [books, students, transactions] = await Promise.all([
    prisma.book.findMany(),
    prisma.student.findMany(),
    prisma.transaction.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const totalBooks     = books.reduce((a, b) => a + b.total, 0);
  const totalAvailable = books.reduce((a, b) => a + b.available, 0);
  const activeIssues   = transactions.filter(t => t.type === "issue" && !t.returnDate);
  const overdue        = activeIssues.filter(t => new Date(t.dueDate) < new Date());
  const totalFines     = transactions.reduce((a, t) => a + (t.type === "issue" && !t.returnDate ? calcFine(t.dueDate) : t.fine), 0);

  const genreCounts: Record<string, number> = {};
  books.forEach(b => { genreCounts[b.genre] = (genreCounts[b.genre] ?? 0) + 1; });

  return ok({
    stats: { totalBooks, totalAvailable, totalStudents: students.length, activeStudents: students.filter(s => s.status === "active").length, activeIssues: activeIssues.length, overdueCount: overdue.length, totalFines },
    recentTransactions: transactions.slice(0, 8),
    overdue,
    genreCounts,
    lowStock: books.filter(b => b.available === 0 || b.available / b.total < 0.3),
  });
}
