import { GradeOpenEndedAnswerUseCase } from "@/application/use-cases/quiz/GradeOpenEndedAnswerUseCase";
import type { OpenEndedGradingMethod } from "@/domain/services/OpenEndedGrader";
import { QuestionRepositoryAdapter } from "@/infrastructure/game/QuestionRepositoryAdapter";
import { StringSimilarityAdapter } from "@/infrastructure/similarity/StringSimilarityAdapter";

const gradeOpenEndedAnswerUseCase = new GradeOpenEndedAnswerUseCase(
  new StringSimilarityAdapter(),
);
const questionRepository = new QuestionRepositoryAdapter();

export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function evaluateOpenEndedSimilarity(
  expected: string,
  userInput: string,
): Promise<{
  percentageSimilar: number;
  gradingMethod: OpenEndedGradingMethod;
  rawScore: number;
}> {
  const result = gradeOpenEndedAnswerUseCase.execute(expected, userInput);
  return {
    percentageSimilar: result.percentageSimilar,
    gradingMethod: result.gradingMethod,
    rawScore: result.rawScore,
  };
}

export async function gradeAndSaveAnswer(
  questionId: string,
  userInput: string,
  requester?: { userId: string; isAdmin?: boolean },
) {
  const question = await questionRepository.findById(questionId);
  if (!question) {
    return { status: 404 as const, body: { message: "Question not found" } };
  }

  if (
    requester &&
    !requester.isAdmin &&
    question.game.userId !== requester.userId
  ) {
    return { status: 403 as const, body: { message: "Forbidden" } };
  }

  await questionRepository.saveUserAnswer(questionId, userInput);

  if (question.questionType === "mcq") {
    const isCorrect =
      question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
    await questionRepository.saveMcqResult(questionId, isCorrect);
    return { status: 200 as const, body: { isCorrect } };
  }

  if (question.questionType === "open_ended") {
    const { percentageSimilar, gradingMethod } = await evaluateOpenEndedSimilarity(
      question.answer,
      userInput,
    );
    await questionRepository.saveOpenEndedResult(questionId, percentageSimilar);
    return {
      status: 200 as const,
      body: { percentageSimilar, gradingMethod },
    };
  }

  return { status: 400 as const, body: { message: "Invalid question type" } };
}
