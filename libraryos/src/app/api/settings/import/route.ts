// src/app/api/settings/import/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  try {
    const data = await req.json();
    const { books, students, users, transactions } = data;

    if (!Array.isArray(books) || !Array.isArray(students)) {
      return err("Invalid backup format", 400);
    }

    // 1. Wipe existing data
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.user.deleteMany({ where: { role: "student" } }),
      prisma.student.deleteMany(),
      prisma.book.deleteMany(),
    ]);

    // 2. Import Books (strip IDs to avoid conflicts if autoincrement sequence isn't reset, but actually we use autoincrement so let's just insert)
    // To maintain relations, we should probably keep data intact but autoincrement might be an issue.
    // However, if we insert with IDs, Postgres might need sequence update.
    // For simplicity, we create them and keep original relations if we can.
    
    // Better way: Insert one by one and map old IDs to new IDs.
    // But since this is a full restore, we can try to force the IDs if the DB allows.
    
    // Let's use createMany if possible, but relation IDs are critical.
    
    for (const b of books) {
      const { id, ...rest } = b;
      await prisma.book.create({ data: { ...rest, id: id } });
    }

    for (const s of students) {
      const { id, ...rest } = s;
      await prisma.student.create({ data: { ...rest, id: id } });
    }

    for (const u of users) {
      const { id, ...rest } = u;
      await prisma.user.create({ data: { ...rest } }); // User IDs are less critical but linked via studentId
    }

    for (const t of transactions) {
      const { id, ...rest } = t;
      await prisma.transaction.create({ data: { ...rest, id: id } });
    }

    // Reset sequences (Postgres specific)
    try {
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Book"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "Book";`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Student"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "Student";`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"User"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "User";`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Transaction"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "Transaction";`);
    } catch (e) {
        console.warn("Could not reset sequences, but data imported.", e);
    }

    return ok({ message: "Library data restored successfully!" });
  } catch (e: any) {
    console.error(e);
    return err(e.message || "Import failed", 500);
  }
}
