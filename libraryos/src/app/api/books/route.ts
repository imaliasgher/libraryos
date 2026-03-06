// src/app/api/books/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET() {
  const books = await prisma.book.findMany({ orderBy: { createdAt: "asc" } });
  return ok(books);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  const body = await req.json();
  const { title, author, isbn, genre, cover, total, available, year, description } = body;
  if (!title || !author || !isbn) return err("title, author, isbn required");

  try {
    const book = await prisma.book.create({
      data: { title, author, isbn, genre: genre ?? "General", cover: cover ?? "📖", total: +total, available: +available, year: +year, description: description ?? "" },
    });
    return ok(book, 201);
  } catch (e: any) {
    if (e.code === "P2002") return err("ISBN already exists");
    return err("Server error", 500);
  }
}
