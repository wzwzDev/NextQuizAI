import type { QuizRepositoryPort } from "@/application/ports/out/QuizRepositoryPort";
import { prisma } from "@/server/core/db";

export class QuizRepositoryAdapter implements QuizRepositoryPort {
  async findApprovedQuizWithQuestions(quizId: string) {
    return prisma.quiz.findUnique({
      where: { id: quizId, approved: true },
      include: { questions: true },
    });
  }

  async findApprovedQuizById(quizId: string) {
    return prisma.quiz.findUnique({
      where: { id: quizId, approved: true },
      select: { id: true, title: true, quizType: true },
    });
  }
}
