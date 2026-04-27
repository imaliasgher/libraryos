import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return err("Forbidden", 403);
  }

  try {
    // Delete all records except the main admin credentials
    await prisma.transaction.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany({ where: { role: "student" } });
    await prisma.student.deleteMany();
    
    return ok({ message: "Database completely wiped!" }, 200);
  } catch (e: any) {
    console.error("Wipe DB Error:", e);
    return err("Internal server error during DB wipe", 500);
  }
}
