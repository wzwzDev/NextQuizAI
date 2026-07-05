const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkQuizTypes() {
  try {
    const quizzes = await prisma.adminQuiz.findMany({
      select: {
        id: true,
        title: true,
        quizType: true,
      },
      take: 5,
    });
    console.log("Current quiz types:");
    console.log(JSON.stringify(quizzes, null, 2));
  } catch (error) {
    console.error("Error checking quiz types:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuizTypes();
