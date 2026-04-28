import type { StringSimilarityPort } from "@/application/ports/out/StringSimilarityPort";
import {
  gradeOpenEndedAnswer,
  type OpenEndedGradeResult,
} from "@/domain/services/OpenEndedGrader";

export class GradeOpenEndedAnswerUseCase {
  constructor(private readonly similarityPort: StringSimilarityPort) {}

  execute(expected: string, userInput: string): OpenEndedGradeResult {
    return gradeOpenEndedAnswer(expected, userInput, this.similarityPort);
  }
}
