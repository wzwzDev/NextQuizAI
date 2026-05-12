import { CreateAdminQuizUseCase } from "@/application/use-cases/admin/CreateAdminQuizUseCase";
import { GetAdminQuizzesUseCase } from "@/application/use-cases/admin/GetAdminQuizzesUseCase";
import { AdminQuizRepositoryAdapter } from "@/infrastructure/admin/AdminQuizRepositoryAdapter";
import { AdminQuizAttemptRepositoryAdapter } from "@/infrastructure/admin/AdminQuizAttemptRepositoryAdapter";
import {
  findApprovedQuizzesForLibrary,
  findAllUserQuizAttempts,
  findApprovedQuizById,
  deleteAdminQuizById,
} from "@/server/admin/repositories/adminQuizRepository";

const adminQuizRepository = new AdminQuizRepositoryAdapter();
const adminQuizAttemptRepository = new AdminQuizAttemptRepositoryAdapter();

const createAdminQuizUseCase = new CreateAdminQuizUseCase(
  adminQuizRepository,
);
const getAdminQuizzesUseCase = new GetAdminQuizzesUseCase(
  adminQuizRepository,
  adminQuizAttemptRepository,
);

export async function createApprovedAdminQuiz(input: {
  title?: string;
  fileName?: string;
  category: string;
  difficulty: string;
  quizType?: "mcq" | "open_ended";
  questions: Array<{
    question: string;
    answer: string;
    options?: string[];
    citation?: { source: string; snippet: string; confidence?: number };
  }>;
}) {
  return createAdminQuizUseCase.execute(input);
}

export async function getAdminQuizzes(filter?: {
  category?: string;
  difficulty?: string;
}) {
  return getAdminQuizzesUseCase.execute(filter);
}

export async function removeAdminQuiz(id: string) {
  return deleteAdminQuizById(id);
}

export async function getApprovedQuiz(id: string) {
  const quiz = await findApprovedQuizById(id);

  if (!quiz) {
    return null;
  }

  return {
    ...quiz,
    allowedAttempts: quiz.allowedAttempts ?? 2,
  };
}

export async function getApprovedQuizLibrary() {
  const quizzes = await findApprovedQuizzesForLibrary();

  return quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    category: quiz.category,
    difficulty: quiz.difficulty,
    quizType: quiz.quizType,
    status: quiz.status,
    allowedAttempts: quiz.allowedAttempts ?? 2,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
    questionCount: quiz._count.questions,
  }));
}

export async function getQuizStatisticsSummary() {
  const attempts = await findAllUserQuizAttempts();

  const statsMap: Record<
    string,
    {
      quizId: string;
      quizTitle: string;
      attempts: number;
      completedAttempts: number;
      totalScore: number;
    }
  > = {};

  for (const attempt of attempts) {
    if (!statsMap[attempt.quizId]) {
      statsMap[attempt.quizId] = {
        quizId: attempt.quizId,
        quizTitle: attempt.quizTitle,
        attempts: 0,
        completedAttempts: 0,
        totalScore: 0,
      };
    }

    statsMap[attempt.quizId].attempts += 1;
    if (attempt.status === "completed") {
      statsMap[attempt.quizId].completedAttempts += 1;
      statsMap[attempt.quizId].totalScore += attempt.score || 0;
    }
  }

  return Object.values(statsMap).map((data) => ({
    quizId: data.quizId,
    quizTitle: data.quizTitle,
    attempts: data.completedAttempts,
    averageScore:
      data.completedAttempts > 0
        ? Math.round((data.totalScore / data.completedAttempts) * 100) / 100
        : 0,
    completionRate:
      data.attempts > 0
        ? Math.round((data.completedAttempts / data.attempts) * 100)
        : 0,
  }));
}
