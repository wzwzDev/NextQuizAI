import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_OWNER_EMAIL = (process.env.OWNER_EMAIL || "waelwzwz@gmail.com").trim().toLowerCase();
const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_LOGIN_EMAIL || "tutormiw@gmail.com").trim().toLowerCase();

async function upsertUser(email: string, name: string) {
  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      isAdmin: true,
      banned: false,
      revoked: false,
    },
    create: {
      email,
      name,
      isAdmin: true,
      banned: false,
      revoked: false,
    },
  });
  console.log(`Ensured user: ${email}`);
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
  await upsertUser(DEFAULT_OWNER_EMAIL, "Owner");
  await upsertUser(DEFAULT_ADMIN_EMAIL, process.env.ADMIN_DISPLAY_NAME || "Admin Account");
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
