import {
  createAdminQuiz,
  deleteAdminQuizById,
  findAdminQuizzes,
  findAllUserQuizAttempts,
  findApprovedQuizzesForLibrary,
  findApprovedQuizById,
} from "@/server/admin/repositories/adminQuizRepository";
import { listUserQuizAttemptsByQuizIds } from "@/server/repositories/userQuizAttemptRepository";

const MIN_MCQ_OPTIONS = 2;

function splitOptionChunks(option: string): string[] {
  if (!option) {
    return [];
  }

  return option
    .split(/\r?\n|[,;|]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeOptions(options: string[] | undefined) {
  if (!Array.isArray(options)) {
    return [];
  }

  return Array.from(
    new Set(
      options
        .filter((value): value is string => typeof value === "string")
        .flatMap(splitOptionChunks),
    ),
  );
}

export async function createApprovedAdminQuiz(input: {
  title?: string;
  fileName?: string;
  category: string;
  difficulty: string;
  quizType?: "mcq" | "open_ended";
  questions: Array<{ question: string; answer: string; options?: string[] }>;
}) {
  let title = input.title?.trim() ?? "";
  if (!title && input.fileName) {
    title = input.fileName.replace(/\.[^/.]+$/, "");
  }
  if (!title) {
    title = "Untitled Quiz";
  }

  const normalizedQuizType = input.quizType ?? "open_ended";
  const normalizedQuestions = input.questions.map((question, index) => {
    const normalizedQuestion = question.question.trim();
    const normalizedAnswer = question.answer.trim();

    if (!normalizedQuestion || !normalizedAnswer) {
      throw new Error(
        `Question ${index + 1} must include both question and answer text.`,
      );
    }

    if (normalizedQuizType !== "mcq") {
      return {
        question: normalizedQuestion,
        answer: normalizedAnswer,
      };
    }

    const options = normalizeOptions([...(question.options ?? []), normalizedAnswer]);
    if (options.length < MIN_MCQ_OPTIONS) {
      throw new Error(
        `Question ${index + 1} must contain at least ${MIN_MCQ_OPTIONS} choices for MCQ.`,
      );
    }

    return {
      question: normalizedQuestion,
      answer: normalizedAnswer,
      options,
    };
  });

  return createAdminQuiz({
    title,
    category: input.category,
    difficulty: input.difficulty,
    quizType: normalizedQuizType,
    status: "approved",
    questions: normalizedQuestions,
  });
}

export async function getAdminQuizzes(filter?: {
  category?: string;
  difficulty?: string;
}) {
  const quizzes = await findAdminQuizzes(filter);
  const attempts = await listUserQuizAttemptsByQuizIds(quizzes.map((quiz) => quiz.id));

  const attemptsByQuizId: Record<
    string,
    {
      totalAttempts: number;
      completedAttempts: number;
      pendingAttempts: number;
      totalCompletedScore: number;
      lastAttemptAt: Date | null;
      lastCompletedAt: Date | null;
    }
  > = {};

  for (const attempt of attempts) {
    if (!attemptsByQuizId[attempt.quizId]) {
      attemptsByQuizId[attempt.quizId] = {
        totalAttempts: 0,
        completedAttempts: 0,
        pendingAttempts: 0,
        totalCompletedScore: 0,
        lastAttemptAt: null,
        lastCompletedAt: null,
      };
    }

    const stats = attemptsByQuizId[attempt.quizId];
    stats.totalAttempts += 1;

    if (attempt.status === "completed") {
      stats.completedAttempts += 1;
      stats.totalCompletedScore += attempt.score || 0;
      if (!stats.lastCompletedAt || (attempt.completedAt && attempt.completedAt > stats.lastCompletedAt)) {
        stats.lastCompletedAt = attempt.completedAt;
      }
    } else {
      stats.pendingAttempts += 1;
    }

    if (!stats.lastAttemptAt || attempt.createdAt > stats.lastAttemptAt) {
      stats.lastAttemptAt = attempt.createdAt;
    }
  }

  return quizzes.map((quiz) => {
    const stats = attemptsByQuizId[quiz.id];
    const averageScore =
      stats && stats.completedAttempts > 0
        ? Math.round((stats.totalCompletedScore / stats.completedAttempts) * 100) / 100
        : null;

    return {
      ...quiz,
      questionCount: quiz.questions.length,
      attemptSummary: {
        totalAttempts: stats?.totalAttempts ?? 0,
        completedAttempts: stats?.completedAttempts ?? 0,
        pendingAttempts: stats?.pendingAttempts ?? 0,
        averageScore,
        lastAttemptAt: stats?.lastAttemptAt ?? null,
        lastCompletedAt: stats?.lastCompletedAt ?? null,
      },
    };
  });
}

export async function removeAdminQuiz(id: string) {
  return deleteAdminQuizById(id);
}

export async function getApprovedQuiz(id: string) {
  return findApprovedQuizById(id);
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
