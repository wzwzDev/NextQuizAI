import { AdminQuizRepositoryPort } from "@/application/ports/admin/AdminQuizRepositoryPort";
import { AdminQuizAttemptRepositoryPort } from "@/application/ports/admin/AdminQuizAttemptRepositoryPort";

/**
 * Use case for retrieving admin quizzes with attempt statistics
 */
export class GetAdminQuizzesUseCase {
  constructor(
    private adminQuizRepository: AdminQuizRepositoryPort,
    private adminQuizAttemptRepository: AdminQuizAttemptRepositoryPort,
  ) {}

  async execute(filter?: { category?: string; difficulty?: string }) {
    const quizzes = await this.adminQuizRepository.findApprovedQuizzesWithAttempts(
      filter,
    );
    const attempts = await this.adminQuizAttemptRepository.findUserAttemptsByQuizIds(
      quizzes.map((quiz) => quiz.id),
    );

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
        if (
          !stats.lastCompletedAt ||
          (attempt.completedAt && attempt.completedAt > stats.lastCompletedAt)
        ) {
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
          ? Math.round((stats.totalCompletedScore / stats.completedAttempts) * 100) /
            100
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
}
