// src/app/api/settings/export/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { err } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  try {
    const [books, students, users, transactions] = await Promise.all([
      prisma.book.findMany(),
      prisma.student.findMany(),
      prisma.user.findMany({ where: { role: "student" } }),
      prisma.transaction.findMany(),
    ]);

    const data = {
      version: "2.1",
      exportedAt: new Date().toISOString(),
      books,
      students,
      users,
      transactions,
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="library_backup_${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (e) {
    console.error(e);
    return err("Export failed", 500);
  }
}
