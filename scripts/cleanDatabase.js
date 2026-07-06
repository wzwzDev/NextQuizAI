const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

/**
 * PRESENTATION DATABASE CLEANUP SCRIPT
 *
 * WHAT THIS DOES:
 * ===============
 * 1. DELETES ALL DATA:
 *    ❌ All created quizzes
 *    ❌ All quiz questions  
 *    ❌ All quiz attempts and history
 *    ❌ All games played
 *    ❌ All topics (Hot Topics list)
 *    ❌ All email verification tokens
 *    ❌ All users EXCEPT the 2 system accounts
 *
 * 2. ENSURES SYSTEM ACCOUNTS ALWAYS EXIST:
 *    ✅ Owner: waelwzwz@gmail.com (Admin + verified)
 *    ✅ Admin: tutormiw@gmail.com (Admin + verified)
 *
 * 3. WHEN USERS TRY TO LOGIN:
 *    - Enter email waelwzwz@gmail.com or tutormiw@gmail.com
 *    - Click magic link in email
 *    - Access granted automatically
 *    - OR use username "admin" + password "admin" if configured
 *
 * RESULT: Clean database ready for presentation demo
 */

async function main() {
  const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_LOGIN_EMAIL || "").trim().toLowerCase();

  if (!ownerEmail || !adminEmail) {
    throw new Error(
      "OWNER_EMAIL and ADMIN_LOGIN_EMAIL must be set in .env.local"
    );
  }

  const keepEmails = Array.from(new Set([ownerEmail, adminEmail]));

  console.log("🧹 PRESENTATION DATABASE CLEANUP");
  console.log("═════════════════════════════════════════════════════════════");
  console.log("🗑️  Deleting all user data...");
  console.log(`📌 Preserving system accounts: ${keepEmails.join(", ")}`);
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
  console.log("⏳ Recreating system accounts...");

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
  console.log("═════════════════════════════════════════════════════════════");
  console.log("✨ DATABASE CLEANUP COMPLETE!");
  console.log("");
  console.log("📊 RESULT:");
  console.log("  ✅ All quizzes deleted");
  console.log("  ✅ All quiz history deleted");
  console.log("  ✅ All hot topics deleted");
  console.log("  ✅ All users deleted except:");
  console.log(`     👑 ${ownerEmail} (Owner/Admin)`);
  console.log(`     👤 ${adminEmail} (Admin)`);
  console.log("");
  console.log("🔐 HOW TO LOGIN FOR DEMO:");
  console.log(`  1. Go to app and click 'Sign In'`);
  console.log(`  2. Enter email: ${ownerEmail} or ${adminEmail}`);
  console.log(`  3. Click magic link in email inbox`);
  console.log(`  4. Access granted - Both are Admins`);
  console.log("");
  console.log("🎬 NEXT STEPS:");
  console.log("  1. Start app: npm run dev");
  console.log("  2. Login with one of the emails above");
  console.log("  3. Go to /admin to manage quizzes");
  console.log("  4. Create new quizzes for your demo");
  console.log("═════════════════════════════════════════════════════════════");
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
