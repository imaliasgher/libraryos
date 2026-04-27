// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-in-production"
);

export interface JWTPayload {
  userId: number;
  email: string;
  role: "admin" | "student";
  studentId?: number;
  studentCode?: string;
  name: string;
  avatar?: string;
  department?: string;
  year?: number;
  status?: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function calcFine(dueDate: string, returnDate?: string | null): number {
  const ref = returnDate ? new Date(returnDate) : new Date();
  const due = new Date(dueDate);
  const overdueDays = Math.max(0, Math.floor((ref.getTime() - due.getTime()) / 86400000));
  return overdueDays * 10;
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function addDays(n = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
