import type { AdminQuiz } from "@/domain/entities/AdminQuiz";

export interface AdminQuizRepositoryPort {
  createApprovedQuiz(input: {
    title: string;
    category: string;
    difficulty: string;
    quizType: "mcq" | "open_ended";
    status: "approved" | "draft";
    questions: Array<{
      question: string;
      answer: string;
      options?: unknown;
      citation?: { source: string; snippet: string; confidence?: number };
    }>;
  }): Promise<AdminQuiz>;

  findApprovedQuizzesWithAttempts(filter?: {
    category?: string;
    difficulty?: string;
  }): Promise<AdminQuiz[]>;

  findApprovedQuizById(id: string): Promise<AdminQuiz | null>;

  deleteQuizById(id: string): Promise<void>;

  findApprovedQuizzesForLibrary(): Promise<AdminQuiz[]>;

  findAllUserQuizAttempts(): Promise<
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
