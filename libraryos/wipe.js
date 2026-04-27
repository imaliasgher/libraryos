const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function run() {
  await prisma.transaction.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany({where: { role: "student" }});
  await prisma.student.deleteMany();
  console.log("Wiped");
}
run().finally(() => prisma.$disconnect());
