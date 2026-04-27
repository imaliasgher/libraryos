// src/app/api/students/[id]/route.ts
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return err("Unauthorized", 401);
  // students can only view their own profile
  if (session.role === "student" && session.studentId !== +params.id) return err("Forbidden", 403);

  const student = await prisma.student.findUnique({
    where: { id: +params.id },
    include: { transactions: { orderBy: { createdAt: "desc" } } },
  });
  if (!student) return err("Not found", 404);
  return ok(student);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return err("Unauthorized", 401);
  // Students can update their own profile (limited fields); admin can update all
  const isOwn = session.role === "student" && session.studentId === +params.id;
  if (!isOwn && session.role !== "admin") return err("Forbidden", 403);

  const body = await req.json();
  const avatar = body.name?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const updateData: any = { name: body.name, email: body.email, phone: body.phone, department: body.department, year: +body.year, avatar };
  if (session.role === "admin") {
    updateData.status = body.status;
    updateData.studentCode = body.studentCode;
    updateData.joined = body.joined;
    if (body.password) {
      updateData.plainPassword = body.password;
    }
  }

  try {
    const student = await prisma.student.update({ where: { id: +params.id }, data: updateData });
    // Sync password to User table if changed
    if (body.password && session.role === "admin") {
      const hash = await bcrypt.hash(body.password, 10);
      await prisma.user.updateMany({
        where: { studentId: student.id },
        data: { password: hash, email: student.email }
      });
    } else if (body.email) {
      // Sync email to user table if changed
      await prisma.user.updateMany({
        where: { studentId: student.id },
        data: { email: student.email }
      });
    }
    return ok(student);
  } catch (e: any) {
    console.error(e);
    return err("Server error", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  try {
    await prisma.user.deleteMany({ where: { studentId: +params.id } });
    await prisma.student.delete({ where: { id: +params.id } });
    return ok({ deleted: true });
  } catch {
    return err("Cannot delete — student has transactions", 400);
  }
}
