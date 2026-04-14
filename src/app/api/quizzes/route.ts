import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { getApprovedQuizLibrary } from "@/server/admin/services/adminQuizService";
import { getUserQuizAttemptStatuses } from "@/server/services/userQuizAttemptService";

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

    const statusByQuizId = new Map(
      attemptStatuses.map((attempt) => [attempt.quizId, attempt]),
    );

    return NextResponse.json({
      quizzes: quizzes.map((quiz) => {
        const userAttempt = statusByQuizId.get(quiz.id);
        const attemptStatus = userAttempt?.status ?? "available";

        return {
          ...quiz,
          attemptStatus,
          isLocked: attemptStatus === "completed",
          userScore: userAttempt?.score ?? null,
          userStartedAt: userAttempt?.startedAt ?? null,
          userCompletedAt: userAttempt?.completedAt ?? null,
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
