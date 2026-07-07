import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OWNER_EMAIL = "waelwzwz@gmail.com";
const TUTOR_EMAIL = "tutormiw@gmail.com";

async function cleanDatabase() {
  try {
    console.log("🔄 Starting database cleanup...\n");

    // Get the two users we want to keep
    const ownerUser = await prisma.user.findUnique({
      where: { email: OWNER_EMAIL },
    });

    const tutorUser = await prisma.user.findUnique({
      where: { email: TUTOR_EMAIL },
    });

    if (!ownerUser || !tutorUser) {
      console.log("⚠️ One or both users not found. Creating them...");
      
      if (!ownerUser) {
        await prisma.user.create({
          data: {
            email: OWNER_EMAIL,
            name: "Owner",
            isAdmin: true,
            banned: false,
            revoked: false,
          },
        });
        console.log(`✅ Created owner user: ${OWNER_EMAIL}`);
      }

      if (!tutorUser) {
        await prisma.user.create({
          data: {
            email: TUTOR_EMAIL,
            name: "Tutor",
            isAdmin: true,
            banned: false,
            revoked: false,
          },
        });
        console.log(`✅ Created tutor user: ${TUTOR_EMAIL}`);
      }
    }

    const usersToKeepIds = [ownerUser?.id, tutorUser?.id].filter(Boolean) as string[];
    console.log(`\n📌 Users to keep: ${usersToKeepIds.join(", ")}`);

    // Delete games and questions for users we're removing
    console.log("\n🗑️ Deleting games and questions for removed users...");
    const deletedQuestions = await prisma.question.deleteMany({
      where: {
        game: {
          userId: {
            notIn: usersToKeepIds,
          },
        },
      },
    });
    console.log(`✅ Deleted ${deletedQuestions.count} questions`);

    const deletedGames = await prisma.game.deleteMany({
      where: {
        userId: {
          notIn: usersToKeepIds,
        },
      },
    });
    console.log(`✅ Deleted ${deletedGames.count} games`);

    // Delete sessions and accounts for removed users
    console.log("\n🗑️ Deleting sessions and accounts...");
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        userId: {
          notIn: usersToKeepIds,
        },
      },
    });
    console.log(`✅ Deleted ${deletedSessions.count} sessions`);

    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        userId: {
          notIn: usersToKeepIds,
        },
      },
    });
    console.log(`✅ Deleted ${deletedAccounts.count} accounts`);

    // Delete users we don't want to keep
    console.log("\n🗑️ Deleting unnecessary users...");
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          notIn: usersToKeepIds,
        },
      },
    });
    console.log(`✅ Deleted ${deletedUsers.count} users`);

    // Delete email verification tokens
    console.log("\n🗑️ Deleting email verification tokens...");
    const deletedTokens = await prisma.emailVerificationToken.deleteMany({});
    console.log(`✅ Deleted ${deletedTokens.count} email verification tokens`);

    // Clean admin quizzes
    console.log("\n🗑️ Deleting admin quizzes...");
    const deletedAdminQuestions = await prisma.adminQuizQuestion.deleteMany({});
    console.log(`✅ Deleted ${deletedAdminQuestions.count} admin questions`);

    const deletedAdminQuizzes = await prisma.adminQuiz.deleteMany({});
    console.log(`✅ Deleted ${deletedAdminQuizzes.count} admin quizzes`);

    // Clean topic counts
    console.log("\n🗑️ Deleting topic counts...");
    const deletedTopics = await prisma.topicCount.deleteMany({});
    console.log(`✅ Deleted ${deletedTopics.count} topic counts`);

    console.log("\n✨ Database cleanup completed successfully!");
    console.log(`\n📊 Remaining users: ${OWNER_EMAIL}, ${TUTOR_EMAIL}`);
    console.log("Ready for practice with a clean app! 🎯");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
