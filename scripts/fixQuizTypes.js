const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateQuizTypes() {
  try {
    const result = await prisma.$executeRawUnsafe(
      "UPDATE AdminQuiz SET quizType = 'open_ended' WHERE quizType IS NULL"
    );
    console.log(`Updated ${result} quizzes with NULL quizType`);
  } catch (error) {
    console.error("Error updating quiz types:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateQuizTypes();
