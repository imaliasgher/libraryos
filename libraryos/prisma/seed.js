// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LibraryOS database...");

  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
  await prisma.student.deleteMany();
  await prisma.book.deleteMany();

  // ── Books ──────────────────────────────────────────────────────────────
  const bookData = [
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565", genre: "Classic Fiction", cover: "🎭", total: 4, available: 2, year: 1925, description: "A story of wealth, idealism, and moral decay in the Jazz Age." },
    { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0061935466", genre: "Historical Fiction", cover: "⚖️", total: 5, available: 5, year: 1960, description: "A young girl's perspective on racial injustice in the American South." },
    { title: "1984", author: "George Orwell", isbn: "978-0451524935", genre: "Dystopian", cover: "👁️", total: 6, available: 1, year: 1949, description: "A chilling portrait of a totalitarian society under constant surveillance." },
    { title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0141439518", genre: "Romance", cover: "💌", total: 3, available: 3, year: 1813, description: "A witty exploration of love, class, and character in Regency England." },
    { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "978-0547928227", genre: "Fantasy", cover: "🧙", total: 5, available: 0, year: 1937, description: "A hobbit's unexpected journey to reclaim a dragon-guarded treasure." },
    { title: "Brave New World", author: "Aldous Huxley", isbn: "978-0060850524", genre: "Dystopian", cover: "🧬", total: 4, available: 4, year: 1932, description: "A futuristic society where humans are engineered and conditioned." },
    { title: "The Catcher in the Rye", author: "J.D. Salinger", isbn: "978-0316769174", genre: "Coming-of-age", cover: "🎠", total: 3, available: 2, year: 1951, description: "A teenager's alienated journey through New York City." },
    { title: "Dune", author: "Frank Herbert", isbn: "978-0441013593", genre: "Science Fiction", cover: "🏜️", total: 4, available: 3, year: 1965, description: "An epic saga of politics, religion, and ecology on a desert planet." },
    { title: "The Alchemist", author: "Paulo Coelho", isbn: "978-0062315007", genre: "Adventure", cover: "✨", total: 6, available: 4, year: 1988, description: "A shepherd's journey to discover his personal legend." },
    { title: "Sapiens", author: "Yuval Noah Harari", isbn: "978-0062316097", genre: "Non-Fiction", cover: "🦴", total: 3, available: 2, year: 2011, description: "A brief history of humankind from ancient times to the present." },
    { title: "Atomic Habits", author: "James Clear", isbn: "978-0735211292", genre: "Self-Help", cover: "⚛️", total: 5, available: 3, year: 2018, description: "How tiny changes can yield remarkable results in daily life." },
    { title: "The Art of War", author: "Sun Tzu", isbn: "978-1599869773", genre: "Philosophy", cover: "⚔️", total: 4, available: 4, year: -500, description: "Ancient Chinese military treatise with timeless strategic wisdom." },
  ];
  const books = [];
  for (const b of bookData) {
    books.push(await prisma.book.create({ data: b }));
  }

  // ── Students ───────────────────────────────────────────────────────────
  const studentData = [
    { name: "Aarav Sharma",  studentCode: "STU001", email: "aarav@uni.edu",   phone: "+91-9876543210", department: "Computer Science", year: 3, avatar: "AS", joined: "2022-07-15", status: "active" },
    { name: "Priya Patel",   studentCode: "STU002", email: "priya@uni.edu",   phone: "+91-9865432109", department: "Literature",       year: 2, avatar: "PP", joined: "2023-07-12", status: "active" },
    { name: "Rohan Mehta",   studentCode: "STU003", email: "rohan@uni.edu",   phone: "+91-9854321098", department: "Physics",          year: 4, avatar: "RM", joined: "2021-07-10", status: "active" },
    { name: "Sneha Iyer",    studentCode: "STU004", email: "sneha@uni.edu",   phone: "+91-9843210987", department: "Mathematics",      year: 1, avatar: "SI", joined: "2024-07-20", status: "active" },
    { name: "Karan Singh",   studentCode: "STU005", email: "karan@uni.edu",   phone: "+91-9832109876", department: "Economics",        year: 2, avatar: "KS", joined: "2023-07-15", status: "suspended" },
    { name: "Ananya Reddy",  studentCode: "STU006", email: "ananya@uni.edu",  phone: "+91-9821098765", department: "History",          year: 3, avatar: "AR", joined: "2022-07-18", status: "active" },
  ];

  const students = [];
  for (const s of studentData) {
    students.push(await prisma.student.create({ data: s }));
  }

  // ── Users (auth accounts) ─────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({ data: { email: "admin@library.edu", password: adminHash, role: "admin" } });

  for (let i = 0; i < students.length; i++) {
    const firstName = students[i].name.split(" ")[0].toLowerCase();
    const hash = await bcrypt.hash(`${firstName}123`, 10);
    await prisma.user.create({ data: { email: studentData[i].email, password: hash, role: "student", studentId: students[i].id } });
  }

  // ── Transactions ──────────────────────────────────────────────────────
  const txData = [
    { bookId: books[0].id, bookTitle: "The Great Gatsby",       studentId: students[0].id, studentName: "Aarav Sharma", studentCode: "STU001", type: "issue",  date: "2025-02-10", dueDate: "2025-03-10", fine: 0 },
    { bookId: books[2].id, bookTitle: "1984",                   studentId: students[0].id, studentName: "Aarav Sharma", studentCode: "STU001", type: "issue",  date: "2025-02-15", dueDate: "2025-03-15", fine: 0 },
    { bookId: books[4].id, bookTitle: "The Hobbit",             studentId: students[1].id, studentName: "Priya Patel",  studentCode: "STU002", type: "issue",  date: "2025-01-20", dueDate: "2025-02-20", fine: 130 },
    { bookId: books[8].id, bookTitle: "The Alchemist",          studentId: students[3].id, studentName: "Sneha Iyer",   studentCode: "STU004", type: "issue",  date: "2025-02-20", dueDate: "2025-03-20", fine: 0 },
    { bookId: books[10].id,bookTitle: "Atomic Habits",          studentId: students[3].id, studentName: "Sneha Iyer",   studentCode: "STU004", type: "issue",  date: "2025-02-22", dueDate: "2025-03-22", fine: 0 },
    { bookId: books[6].id, bookTitle: "The Catcher in the Rye", studentId: students[3].id, studentName: "Sneha Iyer",   studentCode: "STU004", type: "issue",  date: "2025-01-05", dueDate: "2025-02-05", fine: 260 },
    { bookId: books[1].id, bookTitle: "To Kill a Mockingbird",  studentId: students[2].id, studentName: "Rohan Mehta",  studentCode: "STU003", type: "return", date: "2025-01-30", dueDate: "2025-01-25", returnDate: "2025-01-30", fine: 50 },
    { bookId: books[2].id, bookTitle: "1984",                   studentId: students[4].id, studentName: "Karan Singh",  studentCode: "STU005", type: "issue",  date: "2025-02-18", dueDate: "2025-03-18", fine: 0 },
  ];
  for (const t of txData) {
    await prisma.transaction.create({ data: t });
  }

  console.log("✅ Seeding complete!");
  console.log("   Admin  → admin@library.edu  / admin123");
  console.log("   Student→ aarav@uni.edu      / aarav123");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
