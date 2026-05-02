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
  const lines = value.replace(/\r\n/g, "\n").split("\n");

  while (lines.length > 0 && lines[0].trim() === "") {
    lines.shift();
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  return lines.map((line) => line.trimEnd()).join("\n").trimEnd();
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
      if (userLines[start + offset] !== expectedLines[offset]) {
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
    const shouldCompareExecutionOutput = usesExecutionOutputComparison(
      this.expectedRaw,
      this.userInputRaw,
    );

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