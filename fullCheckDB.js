const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== FULL DATABASE CHECK ===\n');
    
    // Count everything
    const quizzes = await prisma.adminQuiz.count();
    const questions = await prisma.adminQuizQuestion.count();
    const attempts = await prisma.userQuizAttempt.count();
    const topics = await prisma.topicCount.count();
    const games = await prisma.game.count();
    const users = await prisma.user.count();
    
    console.log('Counts:');
    console.log('  Admin Quizzes:', quizzes);
    console.log('  Quiz Questions:', questions);
    console.log('  User Attempts:', attempts);
    console.log('  Topics:', topics);
    console.log('  Games:', games);
    console.log('  Users:', users);
    
    // List all topics
    if (topics > 0) {
      console.log('\n✗ Topics still exist:');
      const topicList = await prisma.topicCount.findMany();
      topicList.forEach(t => console.log(`    - ${t.topic}: ${t.count}`));
    }
    
    // List all users
    if (users > 0) {
      console.log('\nUsers:');
      const userList = await prisma.user.findMany({ select: { email: true, isAdmin: true } });
      userList.forEach(u => console.log(`    - ${u.email} (Admin: ${u.isAdmin})`));
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
