import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// ─── Genre mapper (shared) ──────────────────────────────────────────────────
function mapGenre(raw: string | undefined): string {
  if (!raw) return "General";
  const r = raw.toLowerCase();
  if (r.includes("fiction") || r.includes("novel"))        return "Classic Fiction";
  if (r.includes("fantasy"))                               return "Fantasy";
  if (r.includes("science fic") || r.includes("sci-fi"))  return "Science Fiction";
  if (r.includes("dystop"))                                return "Dystopian";
  if (r.includes("romance"))                               return "Romance";
  if (r.includes("histor"))                                return "Historical Fiction";
  if (r.includes("mystery") || r.includes("thriller"))     return "Mystery";
  if (r.includes("biography") || r.includes("memoir"))     return "Biography";
  if (r.includes("self") || r.includes("personal"))        return "Self-Help";
  if (r.includes("philosoph"))                             return "Philosophy";
  if (r.includes("adventure"))                             return "Adventure";
  if (r.includes("horror"))                                return "Horror";
  if (r.includes("coming"))                                return "Coming-of-age";
  return "Non-Fiction";
}

function coverEmoji(genre: string): string {
  const map: Record<string, string> = {
    "Classic Fiction": "🎭", "Fantasy": "🧙", "Science Fiction": "🚀",
    "Dystopian": "👁️", "Romance": "💌", "Historical Fiction": "⚔️",
    "Mystery": "🔍", "Biography": "👤", "Self-Help": "⚛️",
    "Philosophy": "🧠", "Adventure": "✨", "Horror": "👻",
    "Coming-of-age": "🎠", "Non-Fiction": "📊", "General": "📚",
  };
  return map[genre] ?? "📚";
}

// ─── Source 1: Google Books ─────────────────────────────────────────────────
async function fetchGoogleBooks(isbn: string) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.totalItems || !data.items?.length) return null;
    const vol = data.items[0].volumeInfo;
    if (!vol.title) return null;

    const genre = mapGenre(vol.categories?.[0]);
    return {
      title:       vol.title,
      author:      vol.authors?.join(", ") ?? "",
      year:        vol.publishedDate ? parseInt(vol.publishedDate.substring(0, 4)) : new Date().getFullYear(),
      description: vol.description ?? "",
      genre,
      cover:       coverEmoji(genre),
      thumbnail:   vol.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
      publisher:   vol.publisher ?? "",
      pageCount:   vol.pageCount ?? null,
      language:    vol.language ?? "en",
      source:      "Google Books",
    };
  } catch {
    return null;
  }
}

// ─── Source 2: Open Library ─────────────────────────────────────────────────
async function fetchOpenLibrary(isbn: string) {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
      {
        headers: { "User-Agent": "LibraryOS/1.0 (library management system)" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const book = data[`ISBN:${isbn}`];
    if (!book || !book.title) return null;

    // Authors
    const author = book.authors?.map((a: any) => a.name).join(", ") ?? "";

    // Year from publish_date
    const yearMatch = (book.publish_date ?? "").match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

    // Genre from subjects
    const subject = book.subjects?.[0]?.name ?? "";
    const genre = mapGenre(subject);

    // Description from excerpt or notes
    const description = book.excerpts?.[0]?.text ?? book.notes ?? "";

    // Cover
    const thumbnail = book.cover?.medium ?? book.cover?.large ?? null;

    // Publisher
    const publisher = book.publishers?.[0]?.name ?? "";

    // Page count
    const pageCount = book.number_of_pages ?? null;

    return {
      title:       book.title,
      author,
      year,
      description: typeof description === "string" ? description : "",
      genre,
      cover:       coverEmoji(genre),
      thumbnail,
      publisher,
      pageCount,
      language:    "en",
      source:      "Open Library",
    };
  } catch {
    return null;
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const isbn = req.nextUrl.searchParams.get("isbn")?.trim().replace(/-/g, "");
    if (!isbn) return err("ISBN is required");

    // 1. Local DB — fastest path
    const existingBook = await prisma.book.findUnique({ where: { isbn } });
    if (existingBook) {
      return ok({ exists: true, book: existingBook, source: "local" });
    }

    // 2. Google Books API
    const googleMeta = await fetchGoogleBooks(isbn);
    if (googleMeta) {
      return ok({ exists: false, metadata: googleMeta });
    }

    // 3. Open Library (fallback)
    const olMeta = await fetchOpenLibrary(isbn);
    if (olMeta) {
      return ok({ exists: false, metadata: olMeta });
    }

    // 4. Nothing found — let user do manual entry
    return ok({ exists: false, metadata: null, source: "not_found" });

  } catch (error) {
    console.error("Scan API Error:", error);
    return err("Internal server error during barcode scan", 500);
  }
}
