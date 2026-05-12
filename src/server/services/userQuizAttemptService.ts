import { SubmitQuizAttemptUseCase } from "@/application/use-cases/quiz/SubmitQuizAttemptUseCase";
import { ReviewQuizAttemptUseCase } from "@/application/use-cases/quiz/ReviewQuizAttemptUseCase";
import { QuizAttemptRepositoryAdapter } from "@/infrastructure/quiz/QuizAttemptRepositoryAdapter";
import {
  listUserQuizAttemptsByUserId,
  listUserQuizAttemptsByUserIdAndQuizIds,
  findUserQuizAttemptByUserAndQuiz,
  createUserQuizAttempt,
  createPendingUserQuizAttempt,
  countCompletedUserQuizAttempts,
  getLastAttemptNumber,
  findPendingUserQuizAttempt,
  updateUserQuizAttemptNumber,
} from "@/server/repositories/userQuizAttemptRepository";

export class UserQuizAttemptAlreadyCompletedError extends Error {
  constructor() {
    super("You already completed this quiz.");
    this.name = "UserQuizAttemptAlreadyCompletedError";
  }
}

export class UserQuizAttemptNotStartedError extends Error {
  constructor() {
    super("Quiz attempt was not started.");
    this.name = "UserQuizAttemptNotStartedError";
  }
}

export class UserQuizAttemptLimitExceededError extends Error {
  constructor(message: string = "You have reached the maximum number of attempts for this quiz.") {
    super(message);
    this.name = "UserQuizAttemptLimitExceededError";
  }
}

const quizAttemptRepository = new QuizAttemptRepositoryAdapter();
const submitQuizAttemptUseCase = new SubmitQuizAttemptUseCase(quizAttemptRepository);
const reviewQuizAttemptUseCase = new ReviewQuizAttemptUseCase(quizAttemptRepository);

export async function saveUserQuizAttempt(params: {
  userId: string;
  quizId: string;
  quizTitle: string;
  answers: unknown;
  score: number;
}) {
  const existingAttempt = await findUserQuizAttemptByUserAndQuiz(
    params.userId,
    params.quizId,
  );

  // If already completed, throw error
  if (existingAttempt?.status === "completed") {
    throw new UserQuizAttemptAlreadyCompletedError();
  }

  // If pending, complete it
  if (existingAttempt?.status === "pending") {
    try {
      await submitQuizAttemptUseCase.execute({
        userId: params.userId,
        quizId: params.quizId,
        answers: params.answers,
        score: params.score,
      });
      return (await findUserQuizAttemptByUserAndQuiz(params.userId, params.quizId))!;
    } catch (error) {
      if (error instanceof Error && error.message.includes("already completed")) {
        throw new UserQuizAttemptAlreadyCompletedError();
      }
      throw error;
    }
  }

  // No attempt exists, create a new one
  return createUserQuizAttempt(params);
}

export async function getUserQuizAttempt(userId: string, quizId: string) {
  return reviewQuizAttemptUseCase.execute({ userId, quizId });
}

export async function ensurePendingQuizAttempt(params: {
  userId: string;
  quizId: string;
  quizTitle: string;
  allowedAttempts?: number;
}) {
  const completedCount = await countCompletedUserQuizAttempts(
    params.userId,
    params.quizId,
  );

  const allowedAttempts = params.allowedAttempts ?? 1;
  if (completedCount >= allowedAttempts) {
    throw new UserQuizAttemptLimitExceededError(
      `You have completed ${completedCount} of ${allowedAttempts} allowed attempt(s) for this quiz.`,
    );
  }

  // Check if there's already a pending attempt
  const existingPending = await findPendingUserQuizAttempt(
    params.userId,
    params.quizId,
  );

  if (existingPending) {
    return existingPending;
  }

  const existingAttempt = await findUserQuizAttemptByUserAndQuiz(
    params.userId,
    params.quizId,
  );

  if (existingAttempt?.status === "pending") {
    return existingAttempt;
  }

  // Create a new pending attempt with the next attemptNumber
  const lastAttemptNumber = await getLastAttemptNumber(
    params.userId,
    params.quizId,
  );
  const nextAttemptNumber = lastAttemptNumber + 1;

  const pendingAttempt = await createPendingUserQuizAttempt(params);
  
  // Update with the attempt number via repository helper
  if (pendingAttempt) {
    await updateUserQuizAttemptNumber(pendingAttempt.id, nextAttemptNumber);
  }

  if (!pendingAttempt) {
    throw new UserQuizAttemptNotStartedError();
  }

  return pendingAttempt;
}

export async function completePendingQuizAttempt(params: {
  userId: string;
  quizId: string;
  answers: unknown;
  score: number;
}) {
  const existingAttempt = await findUserQuizAttemptByUserAndQuiz(
    params.userId,
    params.quizId,
  );

  if (!existingAttempt) {
    throw new UserQuizAttemptNotStartedError();
  }

  if (existingAttempt.status === "completed") {
    throw new UserQuizAttemptAlreadyCompletedError();
  }

  try {
    await submitQuizAttemptUseCase.execute(params);
    return (await findUserQuizAttemptByUserAndQuiz(params.userId, params.quizId))!;
  } catch (error) {
    if (error instanceof Error && error.message.includes("already completed")) {
      throw new UserQuizAttemptAlreadyCompletedError();
    }
    throw error;
  }
}

export async function getUserQuizAttemptStatuses(
  userId: string,
  quizIds: string[],
) {
  const attempts = await listUserQuizAttemptsByUserIdAndQuizIds(userId, quizIds);
  const latestAttemptsByQuizId = new Map<string, (typeof attempts)[number]>();

  for (const attempt of attempts) {
    if (!latestAttemptsByQuizId.has(attempt.quizId)) {
      latestAttemptsByQuizId.set(attempt.quizId, attempt);
    }
  }

  return Array.from(latestAttemptsByQuizId.values()).map((attempt) => ({
    quizId: attempt.quizId,
    status: attempt.status,
    score: attempt.score,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
  }));
}

export async function getUserQuizStats(userId: string) {
  const attempts = (await listUserQuizAttemptsByUserId(userId)).filter(
    (attempt) => attempt.status === "completed",
  );

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

export type AdaptiveQuizRecommendation = {
  quizId: string;
  recommendationScore: number;
  recommendationReason: string;
  categoryMastery: number | null;
  difficultyReadiness: number | null;
};

function normalizeText(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getDifficultyTarget(difficulty?: string) {
  const normalized = normalizeText(difficulty);
  if (normalized === "easy") {
    return 0.5;
  }

  if (normalized === "medium") {
    return 0.68;
  }

  if (normalized === "hard") {
    return 0.82;
  }

  return 0.65;
}

function extractAttemptMasteryScore(attempt: { score: number; answers: unknown }) {
  const payload = attempt.answers;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return clamp(attempt.score / 100);
  }

  const questionResults = (payload as { questionResults?: unknown }).questionResults;
  if (!Array.isArray(questionResults) || questionResults.length === 0) {
    return clamp(attempt.score / 100);
  }

  const acceptedCount = questionResults.filter(
    (questionResult) =>
      questionResult &&
      typeof questionResult === "object" &&
      (questionResult as { isAccepted?: unknown }).isAccepted === true,
  ).length;

  return clamp(acceptedCount / questionResults.length);
}

export async function getAdaptiveQuizRecommendations(
  userId: string,
  quizzes: Array<{ id: string; category?: string; difficulty?: string }>,
): Promise<AdaptiveQuizRecommendation[]> {
  const attempts = (await listUserQuizAttemptsByUserId(userId)).filter(
    (attempt) => attempt.status === "completed",
  );

  const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const categoryStats: Record<string, { count: number; scoreSum: number }> = {};

  for (const attempt of attempts) {
    const attemptQuiz = quizById.get(attempt.quizId);
    if (!attemptQuiz) {
      continue;
    }

    const categoryKey = normalizeText(attemptQuiz.category);
    if (!categoryKey) {
      continue;
    }

    const masteryScore = extractAttemptMasteryScore(attempt);
    if (!categoryStats[categoryKey]) {
      categoryStats[categoryKey] = { count: 0, scoreSum: 0 };
    }

    categoryStats[categoryKey].count += 1;
    categoryStats[categoryKey].scoreSum += masteryScore;
  }

  return quizzes.map((quiz) => {
    const categoryKey = normalizeText(quiz.category);
    const categoryMastery =
      categoryKey && categoryStats[categoryKey]?.count
        ? clamp(categoryStats[categoryKey].scoreSum / categoryStats[categoryKey].count)
        : null;

    const difficultyTarget = getDifficultyTarget(quiz.difficulty);
    const difficultyReadiness =
      categoryMastery === null
        ? null
        : clamp(1 - Math.abs(difficultyTarget - categoryMastery));

    const recommendationScore =
      categoryMastery === null
        ? 0.65
        : clamp((1 - categoryMastery) * 0.65 + (difficultyReadiness ?? 0.5) * 0.35);

    let recommendationReason = "Recommended by AI based on your recent activity.";
    if (categoryMastery === null) {
      recommendationReason = "New category for you. Good option to diversify practice.";
    } else if (categoryMastery < 0.55) {
      recommendationReason = `You need more practice in ${quiz.category ?? "this category"}.`;
    } else if (difficultyReadiness !== null && difficultyReadiness < 0.55) {
      recommendationReason = "This level may be challenging now and can accelerate learning.";
    } else if (difficultyReadiness !== null && difficultyReadiness > 0.8) {
      recommendationReason = "Difficulty is well aligned with your current mastery.";
    }

    return {
      quizId: quiz.id,
      recommendationScore: roundToTwo(recommendationScore),
      recommendationReason,
      categoryMastery:
        categoryMastery === null ? null : roundToTwo(categoryMastery),
      difficultyReadiness:
        difficultyReadiness === null ? null : roundToTwo(difficultyReadiness),
    };
  });
}

export async function getCompletedAttemptsForUser(
  userId: string,
  quizIds: string[],
) {
  const counts = await Promise.all(
    quizIds.map(async (quizId) => ({
      quizId,
      completedAttempts: await countCompletedUserQuizAttempts(userId, quizId),
    })),
  );

  return counts;
}