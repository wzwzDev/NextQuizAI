import { prisma } from "@/lib/db";

export async function findQuestionById(questionId: string) {
  return prisma.question.findUnique({
    where: { id: questionId },
  });
}

export async function saveUserAnswer(questionId: string, userInput: string) {
  return prisma.question.update({
    where: { id: questionId },
    data: { userAnswer: userInput },
  });
}

export async function saveMcqResult(questionId: string, isCorrect: boolean) {
  return prisma.question.update({
    where: { id: questionId },
    data: { isCorrect },
  });
}

export async function saveOpenEndedResult(
  questionId: string,
  percentageCorrect: number,
) {
  return prisma.question.update({
    where: { id: questionId },
    data: { percentageCorrect },
  });
}
