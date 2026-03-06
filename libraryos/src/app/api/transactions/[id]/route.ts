// src/app/api/transactions/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, todayStr, calcFine } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  const body = await req.json();

  if (body.action === "return") {
    const tx = await prisma.transaction.findUnique({ where: { id: +params.id } });
    if (!tx) return err("Transaction not found", 404);
    if (tx.returnDate) return err("Already returned");

    const returnDate = todayStr();
    const fine = calcFine(tx.dueDate, returnDate);

    const [updated] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: +params.id },
        data: { returnDate, fine, type: "return" },
      }),
      prisma.book.update({
        where: { id: tx.bookId },
        data: { available: { increment: 1 } },
      }),
    ]);
    return ok(updated);
  }

  return err("Unknown action");
}
