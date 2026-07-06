const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const quizzes = await prisma.adminQuiz.count();
    const questions = await prisma.adminQuizQuestion.count();
    const attempts = await prisma.userQuizAttempt.count();
    
    console.log('=== DATABASE VERIFICATION ===');
    console.log('Quizzes:', quizzes);
    console.log('Questions:', questions);
    console.log('Attempts:', attempts);
    
    if (quizzes === 0 && questions === 0 && attempts === 0) {
      console.log('✅ Database is CLEAN');
    } else {
      console.log('❌ Database still has data');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
