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

/** Next STU001-style code from existing rows. */
async function nextStudentCode(): Promise<string> {
  const rows = await prisma.student.findMany({ select: { studentCode: true } });
  let max = 0;
  for (const r of rows) {
    const m = /^STU(\d+)$/i.exec(r.studentCode);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `STU${String(max + 1).padStart(3, "0")}`;
}

/** First word, letters only, lowercased + "123" (e.g. Ajay → ajay123). */
function defaultPasswordFromName(name: string): string {
  const first = name.trim().split(/\s+/)[0] || "stu";
  const letters = first.replace(/[^a-zA-Z]/g, "").toLowerCase();
  const base = letters.length > 0 ? letters : "stu";
  return `${base}123`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  const body = await req.json();
  const { name, studentCode: bodyCode, password: bodyPassword, email, phone, department, year, joined, status } = body;
  if (!name?.trim()) return err("name required");

  const studentCode = (typeof bodyCode === "string" && bodyCode.trim()) ? bodyCode.trim() : await nextStudentCode();
  const password = (typeof bodyPassword === "string" && bodyPassword.trim()) ? bodyPassword.trim() : defaultPasswordFromName(name);
  if (password.length < 4) return err("password too short");

  const emailFinal = (typeof email === "string" && email.trim()) ? email.trim() : `${studentCode.toLowerCase()}@library.local`;

  const avatar = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  try {
    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        studentCode,
        email: emailFinal,
        phone: phone ?? "",
        department: department ?? "General",
        year: +year || 1,
        avatar,
        joined: joined ?? new Date().toISOString().split("T")[0],
        status: status ?? "active",
        plainPassword: password,
      },
    });
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email: emailFinal, password: hash, role: "student", studentId: student.id } });
    return ok(student, 201);
  } catch (e: any) {
    if (e.code === "P2002") return err("Email or studentCode already exists");
    return err("Server error", 500);
  }
}
