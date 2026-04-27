import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// Map Google's broad categories to our genre list
function mapGenre(categories: string[] | undefined): string {
  if (!categories || categories.length === 0) return "General";
  const raw = categories[0].toLowerCase();
  if (raw.includes("fiction") || raw.includes("novel"))         return "Classic Fiction";
  if (raw.includes("fantasy"))                                  return "Fantasy";
  if (raw.includes("science"))                                  return "Science Fiction";
  if (raw.includes("dystop"))                                   return "Dystopian";
  if (raw.includes("romance"))                                  return "Romance";
  if (raw.includes("histor"))                                   return "Historical Fiction";
  if (raw.includes("mystery") || raw.includes("thriller"))      return "Mystery";
  if (raw.includes("biography") || raw.includes("memoir"))      return "Biography";
  if (raw.includes("self") || raw.includes("personal"))        return "Self-Help";
  if (raw.includes("philosoph"))                                return "Philosophy";
  if (raw.includes("adventure"))                                return "Adventure";
  if (raw.includes("horror"))                                   return "Horror";
  if (raw.includes("coming"))                                   return "Coming-of-age";
  return "Non-Fiction";
}

// Pick a cover emoji based on genre (fallback when no thumbnail)
function coverEmoji(genre: string): string {
  const map: Record<string, string> = {
    "Classic Fiction": "🎭", "Fantasy": "🧙", "Science Fiction": "🚀",
    "Dystopian": "👁️", "Romance": "💌", "Historical Fiction": "⚔️",
    "Mystery": "🔍", "Biography": "👤", "Self-Help": "⚛️",
    "Philosophy": "🧠", "Adventure": "✨", "Horror": "👻",
    "Coming-of-age": "🎠", "Non-Fiction": "📊",
  };
  return map[genre] ?? "📚";
}

export async function GET(req: NextRequest) {
  try {
    const isbn = req.nextUrl.searchParams.get("isbn")?.trim();
    if (!isbn) return err("ISBN is required");

    // 1. Check local database first
    const existingBook = await prisma.book.findUnique({ where: { isbn } });
    if (existingBook) {
      return ok({ exists: true, book: existingBook });
    }

    // 2. Not in DB — fetch from Google Books API
    const googleRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
      { next: { revalidate: 3600 } } // Cache for 1h on Vercel edge
    );

    if (!googleRes.ok) {
      console.error("Google Books API HTTP error:", googleRes.status);
      return ok({ exists: false, metadata: null });
    }

    const googleData = await googleRes.json();

    if (googleData.totalItems === 0 || !googleData.items?.length) {
      return ok({ exists: false, metadata: null });
    }

    const vol = googleData.items[0].volumeInfo;
    const genre = mapGenre(vol.categories);

    const metadata = {
      title:       vol.title || "",
      author:      vol.authors ? vol.authors.join(", ") : "",
      year:        vol.publishedDate ? parseInt(vol.publishedDate.substring(0, 4)) : new Date().getFullYear(),
      description: vol.description || "",
      genre,
      cover:       coverEmoji(genre),
      thumbnail:   vol.imageLinks?.thumbnail?.replace("http://", "https://") || null, // HTTPS upgrade
      publisher:   vol.publisher || "",
      pageCount:   vol.pageCount || null,
      language:    vol.language || "en",
    };

    return ok({ exists: false, metadata });

  } catch (error) {
    console.error("Scan API Error:", error);
    return err("Internal server error during barcode scan", 500);
  }
}
