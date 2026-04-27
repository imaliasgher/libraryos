// src/app/api/students/route.ts
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);
  const students = await prisma.student.findMany({ orderBy: { createdAt: "asc" } });
  return ok(students);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  const body = await req.json();
  const { name, studentCode, email, password, phone, department, year, joined, status } = body;
  if (!name || !studentCode || !email || !password) return err("name, studentCode, email, password required");

  const avatar = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  try {
    const student = await prisma.student.create({
      data: { name, studentCode, email, phone: phone ?? "", department: department ?? "General", year: +year, avatar, joined: joined ?? new Date().toISOString().split("T")[0], status: status ?? "active", plainPassword: password },
    });
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, password: hash, role: "student", studentId: student.id } });
    return ok(student, 201);
  } catch (e: any) {
    if (e.code === "P2002") return err("Email or studentCode already exists");
    return err("Server error", 500);
  }
}
