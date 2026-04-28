import stringSimilarity from "string-similarity";
import {
  findQuestionWithGameOwnerById,
  saveMcqResult,
  saveOpenEndedResult,
  saveUserAnswer,
} from "@/server/repositories/questionRepository";

const TYPO_TOLERANCE_THRESHOLD = 0.8;

export type OpenEndedGradingMethod = "exact_match" | "typo_tolerant";

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
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsTokenSequence(fullText: string, phrase: string) {
  const fullTokens = fullText.split(" ").filter(Boolean);
  const phraseTokens = phrase.split(" ").filter(Boolean);

  if (!fullTokens.length || !phraseTokens.length || phraseTokens.length > fullTokens.length) {
    return false;
  }

  const maxStart = fullTokens.length - phraseTokens.length;
  for (let start = 0; start <= maxStart; start++) {
    let matches = true;
    for (let offset = 0; offset < phraseTokens.length; offset++) {
      if (fullTokens[start + offset] !== phraseTokens[offset]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      return true;
    }
  }

  return false;
}

function lexicalScore(expected: string, userInput: string) {
  return stringSimilarity.compareTwoStrings(
    normalizeText(expected),
    normalizeText(userInput),
  );
}

function hasSingleAdjacentSwap(expected: string, userInput: string) {
  if (expected.length !== userInput.length || expected.length < 2) {
    return false;
  }

  const mismatchIndexes: number[] = [];
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== userInput[i]) {
      mismatchIndexes.push(i);
      if (mismatchIndexes.length > 2) {
        return false;
      }
    }
  }

  if (mismatchIndexes.length !== 2) {
    return false;
  }

  const [first, second] = mismatchIndexes;
  if (second !== first + 1) {
    return false;
  }

  return (
    expected[first] === userInput[second] &&
    expected[second] === userInput[first]
  );
}

function typoSimilarityScore(expected: string, userInput: string) {
  if (hasSingleAdjacentSwap(expected, userInput)) {
    return 1;
  }

  return lexicalScore(expected, userInput);
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
      gradingMethod: "exact_match",
      rawScore: 1,
    };
  }

  if (!normalizedUserInput) {
    return {
      percentageSimilar: 0,
      gradingMethod: "typo_tolerant",
      rawScore: 0,
    };
  }

  if (normalizedExpected === normalizedUserInput) {
    return {
      percentageSimilar: 100,
      gradingMethod: "exact_match",
      rawScore: 1,
    };
  }

  if (containsTokenSequence(normalizedUserInput, normalizedExpected)) {
    return {
      percentageSimilar: 100,
      gradingMethod: "typo_tolerant",
      rawScore: 1,
    };
  }

  const score = typoSimilarityScore(normalizedExpected, normalizedUserInput);
  const isAccepted = score >= TYPO_TOLERANCE_THRESHOLD;
  return {
    percentageSimilar: isAccepted ? 100 : 0,
    gradingMethod: "typo_tolerant",
    rawScore: score,
  };
}

export async function gradeAndSaveAnswer(
  questionId: string,
  userInput: string,
  requester?: { userId: string; isAdmin?: boolean },
) {
  const question = await findQuestionWithGameOwnerById(questionId);
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
