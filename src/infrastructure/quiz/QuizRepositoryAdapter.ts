import type { QuizRepositoryPort } from "@/application/ports/out/QuizRepositoryPort";
import { prisma } from "@/server/core/db";
import { Quiz } from "@/domain/entities/Quiz";

export class QuizRepositoryAdapter implements QuizRepositoryPort {
  async findApprovedQuizWithQuestions(quizId: number) {
    const result = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    return Quiz.fromPrisma(result);
  }

  async findApprovedById(quizId: number) {
    const result = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
    return Quiz.fromPrisma(result);
  }
}
