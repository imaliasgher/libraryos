import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const isbn = req.nextUrl.searchParams.get("isbn");
    if (!isbn) return err("ISBN is required");

    // 1. Check local database
    const existingBook = await prisma.book.findUnique({
      where: { isbn },
    });

    if (existingBook) {
      return ok({ exists: true, book: existingBook });
    }

    // 2. Not found locally, fetch from Google Books API
    const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    if (!googleRes.ok) throw new Error("Failed to reach Google Books API");
    
    const googleData = await googleRes.json();

    if (googleData.items && googleData.items.length > 0) {
      const vol = googleData.items[0].volumeInfo;
      const metadata = {
        title: vol.title || "",
        author: vol.authors ? vol.authors.join(", ") : "",
        year: vol.publishedDate ? parseInt(vol.publishedDate.substring(0, 4)) : new Date().getFullYear(),
        description: vol.description || "",
        genre: vol.categories && vol.categories.length > 0 ? vol.categories[0] : "All",
        cover: "📚", // Generic cover as fallback
      };
      return ok({ exists: false, metadata });
    }

    // 3. Not found anywhere
    return ok({ exists: false, metadata: null });
  } catch (error) {
    console.error("Scan API Error:", error);
    return err("Internal server error during barcode scan", 500);
  }
}
