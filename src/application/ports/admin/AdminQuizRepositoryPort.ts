/**
 * Port for admin quiz repository operations
 * Defines the contract for quiz management in the admin domain
 */

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
      options?: string[];
      citation?: { source: string; snippet: string; confidence?: number };
    }>;
  }): Promise<{
    id: string;
    title: string;
    category: string;
    difficulty: string;
    quizType: "mcq" | "open_ended";
    status: string;
    questions: Array<{
      id: string;
      question: string;
      answer: string;
      options?: string | null;
      citation?: { source: string; snippet: string; confidence?: number };
    }>;
  }>;

  findApprovedQuizzesWithAttempts(filter?: {
    category?: string;
    difficulty?: string;
  }): Promise<
    Array<{
      id: string;
      title: string;
      category: string;
      difficulty: string;
      quizType: "mcq" | "open_ended";
      status: string;
      questions: Array<{
        question: string;
        answer: string;
        options?: string[];
        citation?: { source: string; snippet: string; confidence?: number };
      }>;
      _count?: { questions: number };
    }>
  >;

  findApprovedQuizById(id: string): Promise<{
    id: string;
    title: string;
    category: string;
    difficulty: string;
    quizType: "mcq" | "open_ended";
    status: string;
    questions: Array<{
      question: string;
      answer: string;
      options?: string;
      citation?: { source: string; snippet: string; confidence?: number };
    }>;
    createdAt: Date;
    updatedAt: Date;
  } | null>;

  deleteQuizById(id: string): Promise<void>;

  findApprovedQuizzesForLibrary(): Promise<
    Array<{
      id: string;
      title: string;
      category: string;
      difficulty: string;
      quizType: "mcq" | "open_ended";
      status: string;
      createdAt: Date;
      updatedAt: Date;
      _count: { questions: number };
    }>
  >;

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
