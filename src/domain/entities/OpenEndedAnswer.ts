import type { StringSimilarityPort } from "@/application/ports/out/StringSimilarityPort";
import { NormalizedText } from "@/domain/value-objects/NormalizedText";

export type OpenEndedGradingMethod = "exact_match" | "typo_tolerant";

export type OpenEndedGradeResult = {
  percentageSimilar: number;
  gradingMethod: OpenEndedGradingMethod;
  rawScore: number;
  isAccepted: boolean;
};

const TYPO_TOLERANCE_THRESHOLD = 0.8;

export class OpenEndedAnswer {
  private constructor(
    private readonly expected: NormalizedText,
    private readonly userInput: NormalizedText,
  ) {}

  static fromRaw(expected: string, userInput: string) {
    return new OpenEndedAnswer(
      NormalizedText.from(expected),
      NormalizedText.from(userInput),
    );
  }

  grade(similarityPort: StringSimilarityPort): OpenEndedGradeResult {
    if (this.expected.isEmpty && this.userInput.isEmpty) {
      return {
        percentageSimilar: 100,
        gradingMethod: "exact_match",
        rawScore: 1,
        isAccepted: true,
      };
    }

    if (this.userInput.isEmpty) {
      return {
        percentageSimilar: 0,
        gradingMethod: "typo_tolerant",
        rawScore: 0,
        isAccepted: false,
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
    if (this.expected.hasSingleAdjacentSwap(this.userInput)) {
      return 1;
    }

    return similarityPort.compare(this.expected.value, this.userInput.value);
  }
}