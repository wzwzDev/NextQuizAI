import {
  createAdminQuiz,
  deleteAdminQuizById,
  findAdminQuizzes,
  findAllUserQuizAttempts,
  findApprovedQuizById,
} from "@/lib/repositories/adminQuizRepository";

export async function createApprovedAdminQuiz(input: {
  title?: string;
  fileName?: string;
  category: string;
  difficulty: string;
  questions: Array<{ question: string; answer: string }>;
}) {
  let title = input.title?.trim() ?? "";
  if (!title && input.fileName) {
    title = input.fileName.replace(/\.[^/.]+$/, "");
  }
  if (!title) {
    title = "Untitled Quiz";
  }

  return createAdminQuiz({
    title,
    category: input.category,
    difficulty: input.difficulty,
    status: "approved",
    questions: input.questions,
  });
}

export async function getAdminQuizzes(filter?: {
  category?: string;
  difficulty?: string;
}) {
  return findAdminQuizzes(filter);
}

export async function removeAdminQuiz(id: string) {
  return deleteAdminQuizById(id);
}

export async function getApprovedQuiz(id: string) {
  return findApprovedQuizById(id);
}

export async function getQuizStatisticsSummary() {
  const attempts = await findAllUserQuizAttempts();

  const statsMap: Record<
    string,
    { quizId: string; attempts: number; totalScore: number }
  > = {};

  for (const attempt of attempts) {
    if (!statsMap[attempt.quizTitle]) {
      statsMap[attempt.quizTitle] = {
        quizId: attempt.quizId,
        attempts: 0,
        totalScore: 0,
      };
    }
    statsMap[attempt.quizTitle].attempts += 1;
    statsMap[attempt.quizTitle].totalScore += attempt.score || 0;
  }

  return Object.entries(statsMap).map(([quizTitle, data]) => ({
    quizId: data.quizId,
    quizTitle,
    attempts: data.attempts,
    averageScore:
      data.attempts > 0
        ? Math.round((data.totalScore / data.attempts) * 100) / 100
        : 0,
    completionRate: 100,
  }));
}