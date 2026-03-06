// src/app/api/books/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const book = await prisma.book.findUnique({ where: { id: +params.id } });
  if (!book) return err("Not found", 404);
  return ok(book);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  const body = await req.json();
  try {
    const book = await prisma.book.update({
      where: { id: +params.id },
      data: {
        title: body.title, author: body.author, isbn: body.isbn,
        genre: body.genre, cover: body.cover, total: +body.total,
        available: +body.available, year: +body.year, description: body.description,
      },
    });
    return ok(book);
  } catch {
    return err("Server error", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return err("Forbidden", 403);

  try {
    await prisma.book.delete({ where: { id: +params.id } });
    return ok({ deleted: true });
  } catch {
    return err("Cannot delete — book has transactions", 400);
  }
}
