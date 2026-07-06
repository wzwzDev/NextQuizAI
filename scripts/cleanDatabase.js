const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_LOGIN_EMAIL || "").trim().toLowerCase();

  if (!ownerEmail || !adminEmail) {
    throw new Error(
      "OWNER_EMAIL and ADMIN_LOGIN_EMAIL must be set in .env.local"
    );
  }

  const keepEmails = Array.from(new Set([ownerEmail, adminEmail]));

  console.log("🧹 Starting database cleanup for presentation...");
  console.log(`📌 Keeping users: ${keepEmails.join(", ")}`);
  console.log("");

  // 1. Delete UserQuizAttempt
  console.log("⏳ Deleting user quiz attempts...");
  const deletedAttempts = await prisma.userQuizAttempt.deleteMany({});
  console.log(`✅ Deleted ${deletedAttempts.count} user quiz attempts`);

  // 2. Delete AdminQuizQuestion (cascades from AdminQuiz)
  console.log("⏳ Deleting admin quiz questions...");
  const deletedQuestions = await prisma.adminQuizQuestion.deleteMany({});
  console.log(`✅ Deleted ${deletedQuestions.count} quiz questions`);

  // 3. Delete AdminQuiz
  console.log("⏳ Deleting admin quizzes...");
  const deletedAdminQuizzes = await prisma.adminQuiz.deleteMany({});
  console.log(`✅ Deleted ${deletedAdminQuizzes.count} admin quizzes`);

  // 4. Delete Question (cascades from Game)
  console.log("⏳ Deleting game questions...");
  const deletedGameQuestions = await prisma.question.deleteMany({});
  console.log(`✅ Deleted ${deletedGameQuestions.count} game questions`);

  // 5. Delete Game
  console.log("⏳ Deleting games...");
  const deletedGames = await prisma.game.deleteMany({});
  console.log(`✅ Deleted ${deletedGames.count} games`);

  // 6. Delete TopicCount
  console.log("⏳ Deleting topic counts...");
  const deletedTopics = await prisma.topicCount.deleteMany({});
  console.log(`✅ Deleted ${deletedTopics.count} topic counts`);

  // 7. Delete EmailVerificationToken
  console.log("⏳ Deleting email verification tokens...");
  const deletedTokens = await prisma.emailVerificationToken.deleteMany({});
  console.log(`✅ Deleted ${deletedTokens.count} email verification tokens`);

  // 8. Delete non-system users
  console.log("⏳ Deleting non-system users...");
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: keepEmails,
      },
    },
  });
  console.log(`✅ Deleted ${deletedUsers.count} non-system users`);

  // 9. Ensure owner and admin users exist with correct permissions
  console.log("⏳ Ensuring owner and admin users exist...");

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: "Owner",
      isAdmin: true,
      banned: false,
      revoked: false,
      emailVerified: new Date(),
    },
    create: {
      email: ownerEmail,
      name: "Owner",
      isAdmin: true,
      banned: false,
      revoked: false,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Owner user ready: ${ownerEmail}`);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Admin",
      isAdmin: true,
      banned: false,
      revoked: false,
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      name: "Admin",
      isAdmin: true,
      banned: false,
      revoked: false,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin user ready: ${adminEmail}`);

  console.log("");
  console.log("✨ Database cleanup complete!");
  console.log(
    "🎉 Database is now clean with only Owner and Admin users ready for presentation testing."
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
