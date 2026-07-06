import type { StringSimilarityPort } from "@/domain/ports/StringSimilarityPort";
import { NormalizedText } from "@/domain/value-objects/NormalizedText";

export type OpenEndedGradingMethod = "exact_match" | "typo_tolerant";

export type OpenEndedGradeResult = {
  percentageSimilar: number;
  gradingMethod: OpenEndedGradingMethod;
  rawScore: number;
  isAccepted: boolean;
};

const TYPO_TOLERANCE_THRESHOLD = 0.8;

function normalizeExecutionOutput(value: string) {
  const lines = value.replaceAll("\r\n", "\n").split("\n");

  while (lines.length > 0 && lines.at(0)?.trim() === "") {
    lines.shift();
  }

  while (lines.length > 0 && lines.at(-1)?.trim() === "") {
    lines.pop();
  }

  return lines.map((line) => line.trimEnd()).join("\n").trimEnd();
}

function unwrapQuotedValue(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return trimmed;
  }

  const first = trimmed.at(0);
  const last = trimmed.at(-1);
  const isMatchingQuotePair =
    (first === '"' && last === '"') ||
    (first === "'" && last === "'") ||
    (first === "`" && last === "`");

  if (!isMatchingQuotePair) {
    return trimmed;
  }

  return trimmed.slice(1, -1).trim();
}

function normalizeAnswerArtifact(value: string) {
  let normalized = normalizeExecutionOutput(value).trim();
  if (!normalized) {
    return "";
  }

  // Remove markdown code blocks: ````language\ncode\n``` or ````code```\n` or ````code```\n`
  // Pattern matches: backticks + optional (language + newline or just backtick)
  normalized = normalized.replace(/^```(?:[a-z]+\n)?/i, "").replace(/\n?```$/i, "").trim();
  normalized = normalized
    .replace(/^(output|answer|result)\s*[:=-]\s*/i, "")
    .replace(/^the\s+output\s+is\s+/i, "")
    .replace(/^it\s+prints\s+/i, "")
    .trim();

  normalized = unwrapQuotedValue(normalized);
  return normalized.toLowerCase();
}

function containsLineSequence(expectedLines: string[], userLines: string[]) {
  if (
    !expectedLines.length ||
    !userLines.length ||
    expectedLines.length > userLines.length
  ) {
    return false;
  }

  const maxStart = userLines.length - expectedLines.length;
  for (let start = 0; start <= maxStart; start++) {
    let matches = true;
    for (let offset = 0; offset < expectedLines.length; offset++) {
      if (userLines.at(start + offset) !== expectedLines.at(offset)) {
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

function calculateWordMatchPercentage(expectedNormalized: string, userInputNormalized: string) {
  // Common English words to ignore for matching (stopwords)
  const stopwords = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "is", "are", "was", "were", "am", "be", "been",
    "have", "has", "do", "does", "did", "will", "would", "should", "could",
    "may", "might", "must", "can", "it", "this", "that", "these", "those",
    "i", "you", "he", "she", "we", "they", "from", "as", "if", "so",
  ]);

  // Split into words and filter empty strings and stopwords
  const expectedWords = expectedNormalized
    .split(/\s+/)
    .filter((w) => w && !stopwords.has(w));
  const userWords = userInputNormalized
    .split(/\s+/)
    .filter((w) => w && !stopwords.has(w));

  if (expectedWords.length === 0) {
    return userWords.length === 0 ? 1 : 0;
  }

  // Count how many user words match expected words
  let matchedCount = 0;
  const expectedSet = new Set(expectedWords);

  for (const userWord of userWords) {
    if (expectedSet.has(userWord)) {
      matchedCount++;
    }
  }

  // Return percentage based on expected words (not user words)
  // This way if user provides fewer correct words, the percentage reflects that
  return matchedCount / expectedWords.length;
}

function usesExecutionOutputComparison(expectedRaw: string, userInputRaw: string) {
  return expectedRaw.includes("\n") || userInputRaw.includes("\n");
}

export class OpenEndedAnswer {
  private constructor(
    private readonly expectedRaw: string,
    private readonly userInputRaw: string,
    private readonly expected: NormalizedText,
    private readonly userInput: NormalizedText,
  ) {}

  static fromRaw(expected: string, userInput: string) {
    return new OpenEndedAnswer(
      expected,
      userInput,
      NormalizedText.from(expected),
      NormalizedText.from(userInput),
    );
  }

  grade(similarityPort: StringSimilarityPort): OpenEndedGradeResult {
    const expectedExecutionOutput = normalizeExecutionOutput(this.expectedRaw);
    const userExecutionOutput = normalizeExecutionOutput(this.userInputRaw);
    const normalizedExpectedArtifact = normalizeAnswerArtifact(this.expectedRaw);
    const normalizedUserArtifact = normalizeAnswerArtifact(this.userInputRaw);
    const shouldCompareExecutionOutput = usesExecutionOutputComparison(
      this.expectedRaw,
      this.userInputRaw,
    );

    if (
      normalizedExpectedArtifact.length > 0 &&
      normalizedExpectedArtifact === normalizedUserArtifact
    ) {
      return {
        percentageSimilar: 100,
        gradingMethod: "exact_match",
        rawScore: 1,
        isAccepted: true,
      };
    }

    if (shouldCompareExecutionOutput && !expectedExecutionOutput && !userExecutionOutput) {
      return {
        percentageSimilar: 100,
        gradingMethod: "exact_match",
        rawScore: 1,
        isAccepted: true,
      };
    }

    if (shouldCompareExecutionOutput && !userExecutionOutput) {
      return {
        percentageSimilar: 0,
        gradingMethod: "typo_tolerant",
        rawScore: 0,
        isAccepted: false,
      };
    }

    if (
      shouldCompareExecutionOutput &&
      expectedExecutionOutput === userExecutionOutput
    ) {
      return {
        percentageSimilar: 100,
        gradingMethod: "exact_match",
        rawScore: 1,
        isAccepted: true,
      };
    }

    const expectedLines = expectedExecutionOutput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const userLines = userExecutionOutput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (shouldCompareExecutionOutput && containsLineSequence(expectedLines, userLines)) {
      return {
        percentageSimilar: 100,
        gradingMethod: "typo_tolerant",
        rawScore: 1,
        isAccepted: true,
      };
    }

    if (this.expected.value === this.userInput.value) {
      return {
        percentageSimilar: 100,
        gradingMethod: "exact_match",
        rawScore: 1,
        isAccepted: true,
      };
    }

    if (this.userInput.containsSequence(this.expected)) {
      return {
        percentageSimilar: 100,
        gradingMethod: "typo_tolerant",
        rawScore: 1,
        isAccepted: true,
      };
    }

    // Check word-by-word match for partial credit
    const wordMatchPercentage = calculateWordMatchPercentage(
      normalizedExpectedArtifact,
      normalizedUserArtifact,
    );

    // Only apply word-match scoring if it's meaningful (> 40%)
    // This prevents false positives from common stopwords
    if (wordMatchPercentage > 0.4) {
      const scaledPercentage = Math.round(wordMatchPercentage * 100);
      const isAccepted = scaledPercentage >= TYPO_TOLERANCE_THRESHOLD * 100;
      
      return {
        percentageSimilar: scaledPercentage,
        gradingMethod: "typo_tolerant",
        rawScore: wordMatchPercentage,
        isAccepted,
      };
    }

    const similarityScore = this.scoreSimilarity(similarityPort);
    const isAccepted = similarityScore >= TYPO_TOLERANCE_THRESHOLD;

    return {
      percentageSimilar: isAccepted ? 100 : 0,
      gradingMethod: "typo_tolerant",
      rawScore: similarityScore,
      isAccepted,
    };
  }

  private scoreSimilarity(similarityPort: StringSimilarityPort) {
    const expectedExecutionOutput = normalizeExecutionOutput(this.expectedRaw);
    const userExecutionOutput = normalizeExecutionOutput(this.userInputRaw);
    const shouldCompareExecutionOutput = usesExecutionOutputComparison(
      this.expectedRaw,
      this.userInputRaw,
    );

    if (shouldCompareExecutionOutput) {
      return similarityPort.compare(expectedExecutionOutput, userExecutionOutput);
    }

    if (this.expected.hasSingleAdjacentSwap(this.userInput)) {
      return 1;
    }

    return similarityPort.compare(this.expected.value, this.userInput.value);
  }
}