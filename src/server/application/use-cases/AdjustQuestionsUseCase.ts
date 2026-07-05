/**
 * Application Layer: Use Case for Adjusting Questions to New Difficulty
 * 
 * This use case orchestrates the process of taking existing questions
 * and regenerating them at a different difficulty level.
 * 
 * It follows the Clean Architecture principle of having application-specific
 * logic that coordinates between domain and infrastructure.
 */

import { DifficultyLevel } from "@/domain/value-objects/DifficultyLevel";
import { QuestionAdjustmentService } from "@/server/services/question-adjustment/QuestionAdjustmentService";

export interface AdjustQuestionsInput {
  questions: Array<{
    question: string;
    answer: string;
    options?: string[];
    citation?: {
      source: string;
      snippet: string;
      page?: number;
      lineNumber?: number;
      context?: string;
    };
  }>;
  newDifficulty: string;
  category?: string;
  quizType: "mcq" | "open_ended";
}

export interface AdjustedQuestionsOutput {
  success: boolean;
  questions: Array<{
    question: string;
    answer: string;
    options?: string[];
    citation?: {
      source: string;
      snippet: string;
      page?: number;
      lineNumber?: number;
      context?: string;
    };
  }>;
  difficulty: string;
}

export class AdjustQuestionsUseCase {
  constructor(
    private readonly questionAdjustmentService: QuestionAdjustmentService
  ) {}

  /**
   * Execute the use case: adjust questions to a new difficulty level.
   * 
   * @param input - The questions and new difficulty level
   * @returns The adjusted questions with new difficulty applied
   * @throws Error if validation fails or service fails
   */
  async execute(input: AdjustQuestionsInput): Promise<AdjustedQuestionsOutput> {
    // Validate inputs
    this.validateInput(input);

    // Create value object for difficulty (validates it's a valid level)
    const difficultyLevel = DifficultyLevel.create(input.newDifficulty);

    // Delegate to service
    const adjustedQuestions = await this.questionAdjustmentService.adjustQuestions(
      input.questions,
      difficultyLevel,
      input.category,
      input.quizType
    );

    return {
      success: true,
      questions: adjustedQuestions,
      difficulty: difficultyLevel.toString(),
    };
  }

  /**
   * Validate input before processing.
   */
  private validateInput(input: AdjustQuestionsInput): void {
    if (!input.questions || !Array.isArray(input.questions)) {
      throw new Error("Questions must be an array");
    }

    if (input.questions.length === 0) {
      throw new Error("At least one question is required");
    }

    if (!input.newDifficulty) {
      throw new Error("New difficulty level is required");
    }

    if (!["mcq", "open_ended"].includes(input.quizType)) {
      throw new Error("Invalid quiz type");
    }

    // Validate difficulty level
    if (!DifficultyLevel.isValid(input.newDifficulty)) {
      throw new Error(`Invalid difficulty level: ${input.newDifficulty}`);
    }

    // Validate each question has required fields
    for (let i = 0; i < input.questions.length; i++) {
      const q = input.questions[i];
      if (!q.question || typeof q.question !== "string") {
        throw new Error(`Question ${i + 1}: question text is required and must be a string`);
      }
      if (!q.answer || typeof q.answer !== "string") {
        throw new Error(`Question ${i + 1}: answer is required and must be a string`);
      }
    }
  }
}
