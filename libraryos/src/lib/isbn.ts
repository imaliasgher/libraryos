/** Digits only — for comparing scanned codes to stored ISBNs. */
export function isbnDigits(s: string): string {
  return String(s ?? "").replace(/\D/g, "");
}

/** Loose match for ISBN-10 vs ISBN-13 (same title, different string length). */
export function sameIsbn(a: string, b: string): boolean {
  const da = isbnDigits(a);
  const db = isbnDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  if (da.length >= 10 && db.length >= 10) {
    const ta = da.slice(-10);
    const tb = db.slice(-10);
    if (ta === tb) return true;
  }
  return false;
}

export function findBookByIsbn<T extends { isbn: string }>(books: T[], raw: string): T | undefined {
  return books.find((b) => sameIsbn(b.isbn, raw));
}
