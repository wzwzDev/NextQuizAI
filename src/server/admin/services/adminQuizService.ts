import { CreateAdminQuizUseCase } from "@/application/use-cases/admin/CreateAdminQuizUseCase";
import { GetAdminQuizzesUseCase } from "@/application/use-cases/admin/GetAdminQuizzesUseCase";
import { AdminQuizRepositoryAdapter } from "@/infrastructure/admin/AdminQuizRepositoryAdapter";
import { AdminQuizAttemptRepositoryAdapter } from "@/infrastructure/admin/AdminQuizAttemptRepositoryAdapter";
import { prisma } from "@/server/core/db";
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

export async function getPublishedQuizzesWithAttempts(
  userId: string,
  filter?: {
    category?: string;
    difficulty?: string;
  },
) {
  const allQuizzes = await findApprovedQuizzesForLibrary();

  // Filter quizzes
  let filteredQuizzes = allQuizzes;
  if (filter?.category) {
    filteredQuizzes = filteredQuizzes.filter((q) => q.category === filter.category);
  }
  if (filter?.difficulty) {
    filteredQuizzes = filteredQuizzes.filter((q) => q.difficulty === filter.difficulty);
  }

  // Get all attempts for user
  const userAttempts = await prisma.userQuizAttempt.findMany({
    where: { userId },
    select: {
      quizId: true,
      status: true,
      score: true,
    },
  });

  // Map attempts by quiz ID
  const attemptsByQuizId = new Map<
    string,
    { pending: number; completed: number; scores: number[] }
  >();

  for (const attempt of userAttempts) {
    if (!attemptsByQuizId.has(attempt.quizId)) {
      attemptsByQuizId.set(attempt.quizId, { pending: 0, completed: 0, scores: [] });
    }
    const stats = attemptsByQuizId.get(attempt.quizId)!;
    if (attempt.status === "pending") {
      stats.pending += 1;
    } else if (attempt.status === "completed") {
      stats.completed += 1;
      stats.scores.push(attempt.score || 0);
    }
  }

  // Format response
  return filteredQuizzes.map((quiz: any) => {
    const stats = attemptsByQuizId.get(quiz.id);
    const completedAttempts = stats?.completed || 0;
    const pendingAttempts = stats?.pending || 0;
    const totalAttempts = completedAttempts + pendingAttempts;
    const remainingAttempts = Math.max(0, (quiz.allowedAttempts ?? 2) - completedAttempts);
    const isLocked = completedAttempts >= (quiz.allowedAttempts ?? 2);

    // Determine attempt status: completed > pending > available
    let attemptStatus: "available" | "pending" | "completed";
    if (completedAttempts > 0) {
      attemptStatus = "completed";
    } else if (pendingAttempts > 0) {
      attemptStatus = "pending";
    } else {
      attemptStatus = "available";
    }

    return {
      id: quiz.id,
      title: quiz.title,
      category: quiz.category,
      difficulty: quiz.difficulty,
      quizType: quiz.quizType,
      status: quiz.status,
      questionCount: quiz._count?.questions ?? 0,
      allowedAttempts: quiz.allowedAttempts ?? 2,
      attemptStatus,
      isLocked,
      numberOfAttempts: totalAttempts,
      completedAttempts,
      remainingAttempts,
      userScore: stats && stats.scores.length > 0 ? Math.max(...stats.scores) : null,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    };
  });
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

  // Get all existing quiz IDs
  const existingQuizzes = await prisma.adminQuiz.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  const existingQuizIds = new Set(existingQuizzes.map((q) => q.id));
  const quizIdToTitle = new Map(existingQuizzes.map((q) => [q.id, q.title]));

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
    // Skip attempts for deleted quizzes
    if (!existingQuizIds.has(attempt.quizId)) {
      continue;
    }

    if (!statsMap[attempt.quizId]) {
      statsMap[attempt.quizId] = {
        quizId: attempt.quizId,
        quizTitle: quizIdToTitle.get(attempt.quizId) || attempt.quizTitle,
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
