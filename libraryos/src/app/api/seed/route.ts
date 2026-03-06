// src/app/api/seed/route.ts
// Hit GET /api/seed?secret=YOUR_SEED_SECRET to seed the database
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.SEED_SECRET) return err("Forbidden", 403);

  try {
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
    await prisma.student.deleteMany();
    await prisma.book.deleteMany();

    const books = await Promise.all([
      prisma.book.create({ data: { title: "The Great Gatsby",       author: "F. Scott Fitzgerald", isbn: "978-0743273565", genre: "Classic Fiction",    cover: "🎭", total: 4, available: 2, year: 1925,  description: "A story of wealth, idealism, and moral decay in the Jazz Age." } }),
      prisma.book.create({ data: { title: "To Kill a Mockingbird",  author: "Harper Lee",          isbn: "978-0061935466", genre: "Historical Fiction", cover: "⚖️", total: 5, available: 5, year: 1960,  description: "A young girl's perspective on racial injustice in the American South." } }),
      prisma.book.create({ data: { title: "1984",                   author: "George Orwell",       isbn: "978-0451524935", genre: "Dystopian",          cover: "👁️", total: 6, available: 1, year: 1949,  description: "A chilling portrait of a totalitarian society under constant surveillance." } }),
      prisma.book.create({ data: { title: "Pride and Prejudice",    author: "Jane Austen",         isbn: "978-0141439518", genre: "Romance",            cover: "💌", total: 3, available: 3, year: 1813,  description: "A witty exploration of love, class, and character in Regency England." } }),
      prisma.book.create({ data: { title: "The Hobbit",             author: "J.R.R. Tolkien",      isbn: "978-0547928227", genre: "Fantasy",            cover: "🧙", total: 5, available: 0, year: 1937,  description: "A hobbit's unexpected journey to reclaim a dragon-guarded treasure." } }),
      prisma.book.create({ data: { title: "Brave New World",        author: "Aldous Huxley",       isbn: "978-0060850524", genre: "Dystopian",          cover: "🧬", total: 4, available: 4, year: 1932,  description: "A futuristic society where humans are engineered and conditioned." } }),
      prisma.book.create({ data: { title: "The Catcher in the Rye", author: "J.D. Salinger",       isbn: "978-0316769174", genre: "Coming-of-age",      cover: "🎠", total: 3, available: 2, year: 1951,  description: "A teenager's alienated journey through New York City." } }),
      prisma.book.create({ data: { title: "Dune",                   author: "Frank Herbert",       isbn: "978-0441013593", genre: "Science Fiction",    cover: "🏜️", total: 4, available: 3, year: 1965,  description: "An epic saga of politics, religion, and ecology on a desert planet." } }),
      prisma.book.create({ data: { title: "The Alchemist",          author: "Paulo Coelho",        isbn: "978-0062315007", genre: "Adventure",          cover: "✨", total: 6, available: 4, year: 1988,  description: "A shepherd's journey to discover his personal legend." } }),
      prisma.book.create({ data: { title: "Sapiens",                author: "Yuval Noah Harari",   isbn: "978-0062316097", genre: "Non-Fiction",        cover: "🦴", total: 3, available: 2, year: 2011,  description: "A brief history of humankind from ancient times to the present." } }),
      prisma.book.create({ data: { title: "Atomic Habits",          author: "James Clear",         isbn: "978-0735211292", genre: "Self-Help",          cover: "⚛️", total: 5, available: 3, year: 2018,  description: "How tiny changes can yield remarkable results in daily life." } }),
      prisma.book.create({ data: { title: "The Art of War",         author: "Sun Tzu",             isbn: "978-1599869773", genre: "Philosophy",         cover: "⚔️", total: 4, available: 4, year: -500,  description: "Ancient Chinese military treatise with timeless strategic wisdom." } }),
    ]);

    const studentData = [
      { name: "Aarav Sharma",  studentCode: "STU001", email: "aarav@uni.edu",  phone: "+91-9876543210", department: "Computer Science", year: 3, avatar: "AS", joined: "2022-07-15", status: "active",    pass: "aarav123"  },
      { name: "Priya Patel",   studentCode: "STU002", email: "priya@uni.edu",  phone: "+91-9865432109", department: "Literature",       year: 2, avatar: "PP", joined: "2023-07-12", status: "active",    pass: "priya123"  },
      { name: "Rohan Mehta",   studentCode: "STU003", email: "rohan@uni.edu",  phone: "+91-9854321098", department: "Physics",          year: 4, avatar: "RM", joined: "2021-07-10", status: "active",    pass: "rohan123"  },
      { name: "Sneha Iyer",    studentCode: "STU004", email: "sneha@uni.edu",  phone: "+91-9843210987", department: "Mathematics",      year: 1, avatar: "SI", joined: "2024-07-20", status: "active",    pass: "sneha123"  },
      { name: "Karan Singh",   studentCode: "STU005", email: "karan@uni.edu",  phone: "+91-9832109876", department: "Economics",        year: 2, avatar: "KS", joined: "2023-07-15", status: "suspended", pass: "karan123"  },
      { name: "Ananya Reddy",  studentCode: "STU006", email: "ananya@uni.edu", phone: "+91-9821098765", department: "History",          year: 3, avatar: "AR", joined: "2022-07-18", status: "active",    pass: "ananya123" },
    ];

    const students = await Promise.all(studentData.map(({ pass, ...d }) => prisma.student.create({ data: d })));

    const adminHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({ data: { email: "admin@library.edu", password: adminHash, role: "admin" } });
    for (let i = 0; i < students.length; i++) {
      const hash = await bcrypt.hash(studentData[i].pass, 10);
      await prisma.user.create({ data: { email: studentData[i].email, password: hash, role: "student", studentId: students[i].id } });
    }

    await Promise.all([
      prisma.transaction.create({ data: { bookId: books[0].id, bookTitle: "The Great Gatsby",       studentId: students[0].id, studentName: "Aarav Sharma", studentCode: "STU001", type: "issue",  date: "2025-02-10", dueDate: "2025-03-10", fine: 0 } }),
      prisma.transaction.create({ data: { bookId: books[2].id, bookTitle: "1984",                   studentId: students[0].id, studentName: "Aarav Sharma", studentCode: "STU001", type: "issue",  date: "2025-02-15", dueDate: "2025-03-15", fine: 0 } }),
      prisma.transaction.create({ data: { bookId: books[4].id, bookTitle: "The Hobbit",             studentId: students[1].id, studentName: "Priya Patel",  studentCode: "STU002", type: "issue",  date: "2025-01-20", dueDate: "2025-02-20", fine: 130 } }),
      prisma.transaction.create({ data: { bookId: books[8].id, bookTitle: "The Alchemist",          studentId: students[3].id, studentName: "Sneha Iyer",   studentCode: "STU004", type: "issue",  date: "2025-02-20", dueDate: "2025-03-20", fine: 0 } }),
      prisma.transaction.create({ data: { bookId: books[10].id,bookTitle: "Atomic Habits",          studentId: students[3].id, studentName: "Sneha Iyer",   studentCode: "STU004", type: "issue",  date: "2025-02-22", dueDate: "2025-03-22", fine: 0 } }),
      prisma.transaction.create({ data: { bookId: books[6].id, bookTitle: "The Catcher in the Rye", studentId: students[3].id, studentName: "Sneha Iyer",   studentCode: "STU004", type: "issue",  date: "2025-01-05", dueDate: "2025-02-05", fine: 260 } }),
      prisma.transaction.create({ data: { bookId: books[1].id, bookTitle: "To Kill a Mockingbird",  studentId: students[2].id, studentName: "Rohan Mehta",  studentCode: "STU003", type: "return", date: "2025-01-30", dueDate: "2025-01-25", returnDate: "2025-01-30", fine: 50 } }),
      prisma.transaction.create({ data: { bookId: books[2].id, bookTitle: "1984",                   studentId: students[4].id, studentName: "Karan Singh",  studentCode: "STU005", type: "issue",  date: "2025-02-18", dueDate: "2025-03-18", fine: 0 } }),
    ]);

    return ok({ message: "Database seeded successfully!", counts: { books: books.length, students: students.length, transactions: 8 } });
  } catch (e: any) {
    return err(`Seed failed: ${e.message}`, 500);
  }
}
