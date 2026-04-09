import {
  createUserQuizAttempt,
  listUserQuizAttemptsByUserId,
} from "@/server/repositories/userQuizAttemptRepository";

export async function saveUserQuizAttempt(params: {
  userId: string;
  quizId: string;
  quizTitle: string;
  answers: unknown;
  score: number;
}) {
  return createUserQuizAttempt(params);
}

export async function getUserQuizStats(userId: string) {
  const attempts = await listUserQuizAttemptsByUserId(userId);
  const statsMap: Record<
    string,
    {
      id: string;
      title: string;
      attempts: number;
      totalScore: number;
      lastAttempt: Date;
    }
  > = {};

  for (const attempt of attempts) {
    if (!statsMap[attempt.quizId]) {
      statsMap[attempt.quizId] = {
        id: attempt.quizId,
        title: attempt.quizTitle,
        attempts: 0,
        totalScore: 0,
        lastAttempt: attempt.createdAt,
      };
    }
    const item = statsMap[attempt.quizId];
    item.attempts += 1;
    item.totalScore += attempt.score;
    if (attempt.createdAt > item.lastAttempt) {
      item.lastAttempt = attempt.createdAt;
    }
  }

  return Object.values(statsMap).map((stat) => ({
    id: stat.id,
    title: stat.title,
    attempts: stat.attempts,
    averageScore: stat.attempts ? stat.totalScore / stat.attempts : null,
    lastAttempt: stat.lastAttempt,
  }));
}