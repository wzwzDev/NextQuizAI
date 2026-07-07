const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== CHECK USER DATA ===\n');
    
    // Get current session/user info - check who's logged in
    const users = await prisma.user.findMany({
      select: { id: true, email: true, isAdmin: true }
    });
    
    console.log('Users in DB:', users);
    
    // For each user, count their games
    for (const user of users) {
      const gameCount = await prisma.game.count({ where: { userId: user.id } });
      const attemptCount = await prisma.userQuizAttempt.count({ where: { userId: user.id } });
      console.log(`\n${user.email}:`);
      console.log(`  Games: ${gameCount}`);
      console.log(`  Attempts: ${attemptCount}`);
    }
    
    // Check TopicCount
    const allTopics = await prisma.topicCount.findMany();
    console.log('\nAll Topics in DB:', allTopics.length);
    if (allTopics.length > 0) {
      console.log('Topics:');
      allTopics.forEach(t => console.log(`  - ${t.topic}: ${t.count}`));
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
