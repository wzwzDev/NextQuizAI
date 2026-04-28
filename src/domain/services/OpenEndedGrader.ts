import type { StringSimilarityPort } from "@/application/ports/out/StringSimilarityPort";
import {
  OpenEndedAnswer,
  type OpenEndedGradeResult,
  type OpenEndedGradingMethod,
} from "@/domain/entities/OpenEndedAnswer";

export function gradeOpenEndedAnswer(
  expected: string,
  userInput: string,
  similarityPort: StringSimilarityPort,
): OpenEndedGradeResult {
  return OpenEndedAnswer.fromRaw(expected, userInput).grade(similarityPort);
}

export { OpenEndedAnswer };
export type { OpenEndedGradeResult, OpenEndedGradingMethod };
