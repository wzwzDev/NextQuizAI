const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('\n=== DATABASE CHECK ===\n');
    
    const users = await prisma.user.findMany();
    console.log(`Total Users: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.email} (admin: ${u.isAdmin})`));
    
    const attempts = await prisma.userQuizAttempt.findMany();
    console.log(`\nTotal Attempts: ${attempts.length}`);
    if (attempts.length > 0) {
      attempts.slice(0, 5).forEach(a => console.log(`  - Quiz: ${a.quizId}, Status: ${a.status}, Score: ${a.score}`));
    }
    
    const quizzes = await prisma.adminQuiz.findMany();
    console.log(`\nTotal Quizzes: ${quizzes.length}`);
    quizzes.forEach(q => console.log(`  - ${q.title}`));
    
    const topics = await prisma.topicCount.findMany();
    console.log(`\nTotal Topics: ${topics.length}`);
    if (topics.length > 0) {
      topics.slice(0, 5).forEach(t => console.log(`  - ${t.topic}: ${t.count}`));
    }
    
    console.log('\n=== END CHECK ===\n');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
