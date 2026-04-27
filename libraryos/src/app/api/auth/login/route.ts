// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, JWTPayload } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) return err("ID and password required");

    // Unified login: search by email OR student code
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { student: { studentCode: identifier } }
        ]
      },
      include: { student: true },
    });
    
    if (!user) return err("Invalid ID or password", 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return err("Invalid ID or password", 401);

    if (user.role === "student" && user.student?.status === "suspended") {
      return err("Your account is suspended. Contact the library.", 403);
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as "admin" | "student",
      name: user.role === "admin" ? "Library Admin" : user.student?.name ?? "",
      ...(user.role === "student" && user.student
        ? {
            studentId: user.student.id,
            studentCode: user.student.studentCode,
            avatar: user.student.avatar,
            department: user.student.department,
          }
        : {}),
    };

    const token = await signToken(payload);

    const res = ok({ user: payload });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return res;
  } catch (e) {
    console.error(e);
    return err("Server error", 500);
  }
}
