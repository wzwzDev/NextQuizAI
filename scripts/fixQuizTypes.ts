import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateQuizTypes() {
  try {
    const result = await prisma.$executeRaw`UPDATE AdminQuiz SET quizType = 'open_ended' WHERE quizType IS NULL`;
    console.log(`Updated ${result} quizzes with NULL quizType`);
  } catch (error) {
    console.error("Error updating quiz types:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateQuizTypes();
