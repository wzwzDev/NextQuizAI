import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/server/auth/password";

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = "admin@example.com";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin1234";

async function upsertAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: DEFAULT_ADMIN_EMAIL } });
  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);

  if (!existing) {
    await prisma.user.create({
      data: {
        email: DEFAULT_ADMIN_EMAIL,
        name: "Admin",
        isAdmin: true,
        banned: false,
        revoked: false,
        passwordHash,
      },
    });
    console.log(`Created admin user: ${DEFAULT_ADMIN_EMAIL} (password: ${DEFAULT_ADMIN_PASSWORD})`);
  } else {
    // ensure admin flag and password
    await prisma.user.update({
      where: { email: DEFAULT_ADMIN_EMAIL },
      data: {
        isAdmin: true,
        passwordHash,
      },
    });
    console.log(`Updated admin user: ${DEFAULT_ADMIN_EMAIL} (password: ${DEFAULT_ADMIN_PASSWORD})`);
  }
}

async function ensureSampleQuiz() {
  const quizCount = await prisma.adminQuiz.count();
  if (quizCount === 0) {
    await prisma.adminQuiz.create({
      data: {
        title: "Sample Quiz",
        category: "General",
        difficulty: "easy",
        quizType: "mcq",
        status: "approved",
        questions: {
          create: [
            {
              question: "What is the capital of France?",
              answer: "Paris",
              options: ["Paris", "Berlin", "Rome", "Madrid"],
            },
          ],
        },
      },
    });
    console.log("Created sample admin quiz.");
  } else {
    console.log("Admin quizzes already present, skipping sample quiz.");
  }
}

async function main() {
  console.log("Seeding minimal data...");
  await upsertAdmin();
  await ensureSampleQuiz();
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
