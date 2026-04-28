import type { QuestionRepositoryPort } from "@/application/ports/out/QuestionRepositoryPort";
import {
  findQuestionWithGameOwnerById,
  saveUserAnswer,
  saveMcqResult,
  saveOpenEndedResult,
} from "@/server/repositories/questionRepository";

export class QuestionRepositoryAdapter implements QuestionRepositoryPort {
  async findById(questionId: string) {
    return findQuestionWithGameOwnerById(questionId);
  }

  async findQuestionWithGameOwnerById(questionId: string) {
    return findQuestionWithGameOwnerById(questionId);
  }

  async saveUserAnswer(questionId: string, answer: string) {
    await saveUserAnswer(questionId, answer);
  }

  async saveMcqResult(questionId: string, isCorrect: boolean) {
    await saveMcqResult(questionId, isCorrect);
  }

  async saveOpenEndedResult(questionId: string, percentage: number) {
    await saveOpenEndedResult(questionId, percentage);
  }
}
