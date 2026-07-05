/**
 * Application Layer Tests: AdjustQuestionsUseCase
 * 
 * Tests ensure that the use case correctly:
 * - Validates inputs
 * - Creates domain value objects
 * - Delegates to services
 * - Returns properly formatted output
 */

import { AdjustQuestionsUseCase } from "@/server/application/use-cases/AdjustQuestionsUseCase";
import { QuestionAdjustmentService } from "@/server/services/question-adjustment/QuestionAdjustmentService";

// Mock the service
jest.mock("@/server/services/question-adjustment/QuestionAdjustmentService");

describe("AdjustQuestionsUseCase - Application Layer", () => {
  let mockService: jest.Mocked<QuestionAdjustmentService>;
  let useCase: AdjustQuestionsUseCase;

  beforeEach(() => {
    mockService = new QuestionAdjustmentService(
      null as any
    ) as jest.Mocked<QuestionAdjustmentService>;
    useCase = new AdjustQuestionsUseCase(mockService);
  });

  describe("execute method", () => {
    const validInput = {
      questions: [
        {
          question: "What is React?",
          answer: "A JavaScript library",
          options: ["A", "B", "C", "D"],
        },
      ],
      newDifficulty: "medium",
      category: "JavaScript",
      quizType: "mcq" as const,
    };

    const mockAdjustedQuestions = [
      {
        question: "What is the primary purpose of React?",
        answer: "A JavaScript library",
        options: ["A", "B", "C", "D"],
      },
    ];

    it("should successfully execute with valid input", async () => {
      mockService.adjustQuestions = jest
        .fn()
        .mockResolvedValue(mockAdjustedQuestions);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.questions).toEqual(mockAdjustedQuestions);
      expect(result.difficulty).toBe("medium");
    });

    it("should call service with DifficultyLevel value object", async () => {
      mockService.adjustQuestions = jest
        .fn()
        .mockResolvedValue(mockAdjustedQuestions);

      await useCase.execute(validInput);

      expect(mockService.adjustQuestions).toHaveBeenCalledWith(
        validInput.questions,
        expect.objectContaining({
          level: "medium",
        }),
        validInput.category,
        validInput.quizType
      );
    });

    it("should preserve quiz type in service call", async () => {
      mockService.adjustQuestions = jest
        .fn()
        .mockResolvedValue(mockAdjustedQuestions);

      await useCase.execute(validInput);

      const callArgs = mockService.adjustQuestions.mock.calls[0];
      expect(callArgs[3]).toBe("mcq");
    });

    it("should preserve category in service call", async () => {
      mockService.adjustQuestions = jest
        .fn()
        .mockResolvedValue(mockAdjustedQuestions);

      await useCase.execute(validInput);

      const callArgs = mockService.adjustQuestions.mock.calls[0];
      expect(callArgs[2]).toBe("JavaScript");
    });

    it("should work without category", async () => {
      mockService.adjustQuestions = jest
        .fn()
        .mockResolvedValue(mockAdjustedQuestions);

      const inputWithoutCategory = { ...validInput, category: undefined };
      await useCase.execute(inputWithoutCategory);

      const callArgs = mockService.adjustQuestions.mock.calls[0];
      expect(callArgs[2]).toBeUndefined();
    });
  });

  describe("input validation", () => {
    it("should throw error if questions is not an array", async () => {
      const invalidInput = {
        questions: "not an array" as any,
        newDifficulty: "easy",
        quizType: "mcq" as const,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(
        /Questions must be an array/
      );
    });

    it("should throw error if questions array is empty", async () => {
      const invalidInput = {
        questions: [],
        newDifficulty: "easy",
        quizType: "mcq" as const,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(
        /At least one question is required/
      );
    });

    it("should throw error if difficulty is missing", async () => {
      const invalidInput = {
        questions: [{ question: "Q?", answer: "A" }],
        newDifficulty: "",
        quizType: "mcq" as const,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(
        /New difficulty level is required/
      );
    });

    it("should throw error if difficulty is invalid", async () => {
      const invalidInput = {
        questions: [{ question: "Q?", answer: "A" }],
        newDifficulty: "invalid_level",
        quizType: "mcq" as const,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(
        /Invalid difficulty level/
      );
    });

    it("should throw error if quizType is invalid", async () => {
      const invalidInput = {
        questions: [{ question: "Q?", answer: "A" }],
        newDifficulty: "easy",
        quizType: "invalid_type" as any,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(
        /Invalid quiz type/
      );
    });

    it("should throw error if question text is missing", async () => {
      const invalidInput = {
        questions: [{ question: "", answer: "A" }],
        newDifficulty: "easy",
        quizType: "mcq" as const,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(
        /question text is required/
      );
    });

    it("should throw error if answer is missing", async () => {
      const invalidInput = {
        questions: [{ question: "Q?", answer: "" }],
        newDifficulty: "easy",
        quizType: "mcq" as const,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(
        /answer is required/
      );
    });

    it("should throw error if question is not a string", async () => {
      const invalidInput = {
        questions: [{ question: 123 as any, answer: "A" }],
        newDifficulty: "easy",
        quizType: "mcq" as const,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrow(
        /must be a string/
      );
    });
  });

  describe("multiple questions", () => {
    it("should handle multiple questions", async () => {
      mockService.adjustQuestions = jest.fn().mockResolvedValue([
        {
          question: "Q1 adjusted",
          answer: "A1",
        },
        {
          question: "Q2 adjusted",
          answer: "A2",
        },
        {
          question: "Q3 adjusted",
          answer: "A3",
        },
      ]);

      const input = {
        questions: [
          { question: "Q1", answer: "A1" },
          { question: "Q2", answer: "A2" },
          { question: "Q3", answer: "A3" },
        ],
        newDifficulty: "hard",
        quizType: "open_ended" as const,
      };

      const result = await useCase.execute(input);

      expect(result.questions.length).toBe(3);
      expect(result.questions[0].question).toBe("Q1 adjusted");
    });
  });

  describe("service error handling", () => {
    it("should propagate service errors", async () => {
      mockService.adjustQuestions = jest
        .fn()
        .mockRejectedValue(new Error("Service failed"));

      const input = {
        questions: [{ question: "Q?", answer: "A" }],
        newDifficulty: "easy",
        quizType: "mcq" as const,
      };

      await expect(useCase.execute(input)).rejects.toThrow("Service failed");
    });
  });
});
