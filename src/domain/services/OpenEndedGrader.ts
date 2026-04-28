import type { StringSimilarityPort } from "@/application/ports/out/StringSimilarityPort";

export type OpenEndedGradingMethod = "exact_match" | "typo_tolerant";

export type OpenEndedGradeResult = {
  percentageSimilar: number;
  gradingMethod: OpenEndedGradingMethod;
  rawScore: number;
  isAccepted: boolean;
};

const TYPO_TOLERANCE_THRESHOLD = 0.8;

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
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

function typoSimilarityScore(
  expected: string,
  userInput: string,
  similarityPort: StringSimilarityPort,
) {
  if (hasSingleAdjacentSwap(expected, userInput)) {
    return 1;
  }

  return similarityPort.compare(expected, userInput);
}

export function gradeOpenEndedAnswer(
  expected: string,
  userInput: string,
  similarityPort: StringSimilarityPort,
): OpenEndedGradeResult {
  const normalizedExpected = normalizeText(expected);
  const normalizedUserInput = normalizeText(userInput);

  if (!normalizedExpected && !normalizedUserInput) {
    return {
      percentageSimilar: 100,
      gradingMethod: "exact_match",
      rawScore: 1,
      isAccepted: true,
    };
  }

  if (!normalizedUserInput) {
    return {
      percentageSimilar: 0,
      gradingMethod: "typo_tolerant",
      rawScore: 0,
      isAccepted: false,
    };
  }

  if (normalizedExpected === normalizedUserInput) {
    return {
      percentageSimilar: 100,
      gradingMethod: "exact_match",
      rawScore: 1,
      isAccepted: true,
    };
  }

  if (containsTokenSequence(normalizedUserInput, normalizedExpected)) {
    return {
      percentageSimilar: 100,
      gradingMethod: "typo_tolerant",
      rawScore: 1,
      isAccepted: true,
    };
  }

  const score = typoSimilarityScore(
    normalizedExpected,
    normalizedUserInput,
    similarityPort,
  );

  const isAccepted = score >= TYPO_TOLERANCE_THRESHOLD;
  return {
    percentageSimilar: isAccepted ? 100 : 0,
    gradingMethod: "typo_tolerant",
    rawScore: score,
    isAccepted,
  };
}
