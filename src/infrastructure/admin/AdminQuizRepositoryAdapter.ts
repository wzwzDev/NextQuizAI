import { AdminQuizRepositoryPort } from "@/application/ports/admin/AdminQuizRepositoryPort";
import {
  createAdminQuiz,
  deleteAdminQuizById,
  findAdminQuizzes,
  findAllUserQuizAttempts,
  findApprovedQuizzesForLibrary,
  findApprovedQuizById,
} from "@/server/admin/repositories/adminQuizRepository";
import { AdminQuiz } from "@/domain/entities/AdminQuiz";

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
    const res = await createAdminQuiz({
      title: input.title,
      category: input.category,
      difficulty: input.difficulty,
      quizType: input.quizType,
      status: input.status,
      questions: input.questions,
    });
    return AdminQuiz.fromPrisma(res)!;
  }

  async findApprovedQuizzesWithAttempts(filter?: {
    category?: string;
    difficulty?: string;
  }) {
    const res = await findAdminQuizzes(filter);
    return (res ?? [])
      .map((r: unknown) => AdminQuiz.fromPrisma(r))
      .filter((quiz): quiz is AdminQuiz => quiz !== null);
  }

  async findApprovedQuizById(id: string) {
    const res = await findApprovedQuizById(id);
    return AdminQuiz.fromPrisma(res);
  }

  async deleteQuizById(id: string) {
    await deleteAdminQuizById(id);
  }

  async findApprovedQuizzesForLibrary() {
    const res = await findApprovedQuizzesForLibrary();
    return (res ?? [])
      .map((r: unknown) => AdminQuiz.fromPrisma(r))
      .filter((quiz): quiz is AdminQuiz => quiz !== null);
  }

  async findAllUserQuizAttempts() {
    return findAllUserQuizAttempts();
  }
}
