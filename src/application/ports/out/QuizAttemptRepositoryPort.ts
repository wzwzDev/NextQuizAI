export interface QuizAttemptRepositoryPort {
  ensurePending(input: {
    userId: string;
    quizId: string;
    quizTitle: string;
  }): Promise<{ id: string; status: "pending" | "completed" }>;

  complete(input: {
    userId: string;
    quizId: string;
    score: number;
    details: unknown;
  }): Promise<void>;
}
