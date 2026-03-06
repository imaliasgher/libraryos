// src/app/api/transactions/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, todayStr, addDays, calcFine } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return err("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  // Students can only see their own transactions
  if (session.role === "student") {
    const txs = await prisma.transaction.findMany({
      where: { studentId: session.studentId },
      orderBy: { createdAt: "desc" },
    });
    // Enrich with live fines
    const enriched = txs.map(t => ({
      ...t,
      liveFine: t.returnDate ? t.fine : calcFine(t.dueDate),
    }));
    return ok(enriched);
  }

  // Admin: can filter by studentId or get all
  const where = studentId ? { studentId: +studentId } : {};
  const txs = await prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" } });
  const enriched = txs.map(t => ({
    ...t,
    liveFine: t.returnDate ? t.fine : calcFine(t.dueDate),
  }));
  return ok(enriched);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return err("Unauthorized", 401);

  const body = await req.json();

  // ── ISSUE ──────────────────────────────────────────────────────────────
  if (body.action === "issue") {
    const bookId = +body.bookId;
    const studentId = session.role === "admin" ? +body.studentId : session.studentId!;
    const days = +(body.days ?? 30);

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return err("Book not found", 404);
    if (book.available < 1) return err("No copies available");

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return err("Student not found", 404);
    if (student.status === "suspended") return err("Student account is suspended");

    // Check if student already has this book
    const existing = await prisma.transaction.findFirst({
      where: { bookId, studentId, type: "issue", returnDate: null },
    });
    if (existing) return err("Student already has this book");

    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          bookId, bookTitle: book.title,
          studentId, studentName: student.name, studentCode: student.studentCode,
          type: "issue", date: todayStr(), dueDate: addDays(days), fine: 0,
        },
      }),
      prisma.book.update({ where: { id: bookId }, data: { available: { decrement: 1 } } }),
    ]);
    return ok(tx, 201);
  }

  return err("Unknown action");
}
