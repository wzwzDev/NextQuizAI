import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { getApprovedQuizLibrary } from "@/server/admin/services/adminQuizService";
import { getCompletedAttemptsForUser } from "@/server/services/userQuizAttemptService";
import {
  getAdaptiveQuizRecommendations,
  getUserQuizAttemptStatuses,
} from "@/server/services/userQuizAttemptService";

export async function GET(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quizzes = await getApprovedQuizLibrary();
    const attemptStatuses = await getUserQuizAttemptStatuses(
      session.user.id,
      quizzes.map((quiz) => quiz.id),
    );
    const recommendations = await getAdaptiveQuizRecommendations(
      session.user.id,
      quizzes,
    );
    const attemptCounts = await getCompletedAttemptsForUser(
      session.user.id,
      quizzes.map((q) => q.id),
    );

    const statusByQuizId = new Map(
      attemptStatuses.map((attempt) => [attempt.quizId, attempt]),
    );
    const recommendationByQuizId = new Map(
      recommendations.map((recommendation) => [recommendation.quizId, recommendation]),
    );
    const completedAttemptsByQuizId = new Map(
      attemptCounts.map((attempt) => [attempt.quizId, attempt.completedAttempts]),
    );

    return NextResponse.json({
      quizzes: quizzes.map((quiz) => {
        const userAttempt = statusByQuizId.get(quiz.id);
        const attemptStatus = userAttempt?.status ?? "available";
        const recommendation = recommendationByQuizId.get(quiz.id);
        const allowedAttempts = quiz.allowedAttempts ?? 2;
        const completedAttempts = completedAttemptsByQuizId.get(quiz.id) ?? 0;
        const remainingAttempts = Math.max(allowedAttempts - completedAttempts, 0);

        return {
          ...quiz,
          attemptStatus,
          isLocked: remainingAttempts === 0,
          userScore: userAttempt?.score ?? null,
          userStartedAt: userAttempt?.startedAt ?? null,
          userCompletedAt: userAttempt?.completedAt ?? null,
          completedAttempts,
          allowedAttempts,
          remainingAttempts,
          recommendationScore: recommendation?.recommendationScore ?? null,
          recommendationReason: recommendation?.recommendationReason ?? null,
          categoryMastery: recommendation?.categoryMastery ?? null,
          difficultyReadiness: recommendation?.difficultyReadiness ?? null,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load quizzes." },
      { status: 500 },
    );
  }
}
