import stringSimilarity from "string-similarity";
import { canUseEmbeddings, getEmbedding } from "@/server/ai/openaiClient";
import {
  findQuestionById,
  saveMcqResult,
  saveOpenEndedResult,
  saveUserAnswer,
} from "@/server/repositories/questionRepository";

const LEXICAL_THRESHOLD = 0.8;
const SEMANTIC_THRESHOLD = 0.78;

export type OpenEndedGradingMethod = "semantic" | "lexical_fallback";

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

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function toPercentage(score: number, threshold: number) {
  const clamped = Math.max(0, Math.min(1, score));
  return clamped < threshold ? 0 : Math.round(clamped * 100);
}

function lexicalScore(expected: string, userInput: string) {
  return stringSimilarity.compareTwoStrings(
    normalizeText(expected),
    normalizeText(userInput),
  );
}

export async function evaluateOpenEndedSimilarity(
  expected: string,
  userInput: string,
): Promise<{
  percentageSimilar: number;
  gradingMethod: OpenEndedGradingMethod;
  rawScore: number;
}> {
  const normalizedExpected = normalizeText(expected);
  const normalizedUserInput = normalizeText(userInput);

  if (!normalizedExpected && !normalizedUserInput) {
    return {
      percentageSimilar: 100,
      gradingMethod: "lexical_fallback",
      rawScore: 1,
    };
  }

  if (!normalizedUserInput) {
    return {
      percentageSimilar: 0,
      gradingMethod: "lexical_fallback",
      rawScore: 0,
    };
  }

  if (canUseEmbeddings()) {
    try {
      const [expectedEmbedding, userEmbedding] = await Promise.all([
        getEmbedding(normalizedExpected),
        getEmbedding(normalizedUserInput),
      ]);
      const semanticScore = cosineSimilarity(expectedEmbedding, userEmbedding);
      return {
        percentageSimilar: toPercentage(semanticScore, SEMANTIC_THRESHOLD),
        gradingMethod: "semantic",
        rawScore: semanticScore,
      };
    } catch {
      // Fall through to lexical fallback for resiliency.
    }
  }

  const score = lexicalScore(normalizedExpected, normalizedUserInput);
  return {
    percentageSimilar: toPercentage(score, LEXICAL_THRESHOLD),
    gradingMethod: "lexical_fallback",
    rawScore: score,
  };
}

export async function gradeAndSaveAnswer(questionId: string, userInput: string) {
  const question = await findQuestionById(questionId);
  if (!question) {
    return { status: 404 as const, body: { message: "Question not found" } };
  }

  await saveUserAnswer(questionId, userInput);

  if (question.questionType === "mcq") {
    const isCorrect =
      question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
    await saveMcqResult(questionId, isCorrect);
    return { status: 200 as const, body: { isCorrect } };
  }

  if (question.questionType === "open_ended") {
    const { percentageSimilar, gradingMethod } = await evaluateOpenEndedSimilarity(
      question.answer,
      userInput,
    );
    await saveOpenEndedResult(questionId, percentageSimilar);
    return {
      status: 200 as const,
      body: { percentageSimilar, gradingMethod },
    };
  }

  return { status: 400 as const, body: { message: "Invalid question type" } };
}
