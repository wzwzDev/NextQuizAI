const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("📊 Database Status for Presentation:\n");

  // Count users
  const userCount = await prisma.user.count();
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      isAdmin: true,
      banned: true,
    },
  });

  console.log(`👥 Users (${userCount}):`);
  users.forEach((u) => {
    const icon = u.isAdmin ? "👑" : "👤";
    console.log(`  ${icon} ${u.email} (${u.name}) - Admin: ${u.isAdmin}`);
  });

  // Count quizzes
  const quizCount = await prisma.adminQuiz.count();
  console.log(`\n📋 Admin Quizzes: ${quizCount}`);

  // Count questions
  const questionCount = await prisma.adminQuizQuestion.count();
  console.log(`❓ Quiz Questions: ${questionCount}`);

  // Count games
  const gameCount = await prisma.game.count();
  console.log(`🎮 Games: ${gameCount}`);

  // Count attempts
  const attemptCount = await prisma.userQuizAttempt.count();
  console.log(`📝 Quiz Attempts: ${attemptCount}`);

  // Count topics
  const topicCount = await prisma.topicCount.count();
  console.log(`🏷️  Hot Topics: ${topicCount}`);

  console.log("\n✨ Database is ready for presentation testing!");
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
