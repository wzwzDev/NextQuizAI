/**
 * Port for admin quiz attempt repository operations
 * Defines the contract for quiz attempt management in the admin domain
 */

export interface AdminQuizAttemptRepositoryPort {
  findUserAttemptsByQuizIds(quizIds: string[]): Promise<
    Array<{
      quizId: string;
      quizTitle: string;
      status: "completed" | "pending";
      score: number | null;
      createdAt: Date;
      completedAt: Date | null;
    }>
  >;
}
