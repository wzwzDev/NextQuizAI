import { AdminQuizRepositoryPort } from "@/application/ports/admin/AdminQuizRepositoryPort";
import {
  createAdminQuiz,
  deleteAdminQuizById,
  findAdminQuizzes,
  findAllUserQuizAttempts,
  findApprovedQuizzesForLibrary,
  findApprovedQuizById,
} from "@/server/admin/repositories/adminQuizRepository";

/**
 * Adapter for admin quiz repository operations
 * Wraps the admin quiz repository to implement the AdminQuizRepositoryPort
 */
export class AdminQuizRepositoryAdapter implements AdminQuizRepositoryPort {
  async createApprovedQuiz(input: {
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
  }) {
    // createAdminQuiz returns the full quiz object with questions included
    return createAdminQuiz({
      title: input.title,
      category: input.category,
      difficulty: input.difficulty,
      quizType: input.quizType,
      status: input.status,
      questions: input.questions,
    });
  }

  async findApprovedQuizzesWithAttempts(filter?: {
    category?: string;
    difficulty?: string;
  }) {
    return findAdminQuizzes(filter);
  }

  async findApprovedQuizById(id: string) {
    return findApprovedQuizById(id);
  }

  async deleteQuizById(id: string) {
    await deleteAdminQuizById(id);
  }

  async findApprovedQuizzesForLibrary() {
    return findApprovedQuizzesForLibrary();
  }

  async findAllUserQuizAttempts() {
    return findAllUserQuizAttempts();
  }
}
