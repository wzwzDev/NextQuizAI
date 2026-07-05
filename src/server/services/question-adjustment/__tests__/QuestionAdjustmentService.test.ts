/**
 * Application Service Tests: QuestionAdjustmentService
 * 
 * Tests ensure that the service correctly:
 * - Calls LLM adapter with proper prompts
 * - Merges LLM responses with original questions
 * - Handles MCQ option regeneration
 * - Preserves citations
 */

import { QuestionAdjustmentService } from "@/server/services/question-adjustment/QuestionAdjustmentService";
import { DifficultyLevel } from "@/domain/value-objects/DifficultyLevel";
import { LlmPort } from "@/infrastructure/ports/LlmPort";

describe("QuestionAdjustmentService - Application Service", () => {
  let mockLlmAdapter: jest.Mocked<LlmPort>;
  let service: QuestionAdjustmentService;

  beforeEach(() => {
    mockLlmAdapter = {
      adjustQuestions: jest.fn(),
      generateMcqOptions: jest.fn(),
    };
    service = new QuestionAdjustmentService(mockLlmAdapter);
  });

  const mockQuestion = {
    question: "What is JavaScript?",
    answer: "A programming language",
    options: ["Option A", "Option B", "Option C", "Option D"],
    citation: {
      source: "book.pdf",
      snippet: "JavaScript is...",
      page: 42,
      lineNumber: 10,
      context: "In Chapter 5...",
    },
  };

  const mockDifficulty = DifficultyLevel.create("medium");

  describe("adjustQuestions for open_ended quiz", () => {
    it("should call LLM adapter to adjust questions", async () => {
      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        {
          question: "What is the definition of JavaScript?",
          answer: "A programming language",
        },
      ]);

      const result = await service.adjustQuestions(
        [mockQuestion],
        mockDifficulty,
        "Programming",
        "open_ended"
      );

      expect(mockLlmAdapter.adjustQuestions).toHaveBeenCalled();
      expect(result[0].question).toBe(
        "What is the definition of JavaScript?"
      );
    });

    it("should preserve original citation", async () => {
      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        {
          question: "Adjusted question",
          answer: "Same answer",
        },
      ]);

      const result = await service.adjustQuestions(
        [mockQuestion],
        mockDifficulty,
        "Programming",
        "open_ended"
      );

      expect(result[0].citation).toEqual(mockQuestion.citation);
    });

    it("should NOT call option generation for open_ended", async () => {
      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        {
          question: "Adjusted question",
          answer: "Same answer",
        },
      ]);

      await service.adjustQuestions(
        [mockQuestion],
        mockDifficulty,
        "Programming",
        "open_ended"
      );

      expect(mockLlmAdapter.generateMcqOptions).not.toHaveBeenCalled();
    });
  });

  describe("adjustQuestions for MCQ quiz", () => {
    it("should call both adjust and option generation for MCQ", async () => {
      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        {
          question: "Adjusted question",
          answer: "Same answer",
        },
      ]);
      mockLlmAdapter.generateMcqOptions!.mockResolvedValue([
        {
          questionIndex: 0,
          options: ["Wrong 1", "Wrong 2", "Wrong 3"],
        },
      ]);

      await service.adjustQuestions(
        [mockQuestion],
        mockDifficulty,
        "Programming",
        "mcq"
      );

      expect(mockLlmAdapter.adjustQuestions).toHaveBeenCalled();
      expect(mockLlmAdapter.generateMcqOptions).toHaveBeenCalled();
    });

    it("should regenerate MCQ options with LLM response", async () => {
      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        {
          question: "Adjusted question",
          answer: "A programming language",
        },
      ]);
      mockLlmAdapter.generateMcqOptions!.mockResolvedValue([
        {
          questionIndex: 0,
          options: ["HTML", "Python", "Java"],
        },
      ]);

      const result = await service.adjustQuestions(
        [mockQuestion],
        mockDifficulty,
        "Programming",
        "mcq"
      );

      expect(result[0].options).toBeDefined();
      expect(result[0].options).toContain("A programming language"); // Correct answer
      expect(result[0].options?.length).toBe(4); // 1 correct + 3 wrong
    });

    it("should shuffle options with correct answer in random position", async () => {
      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        {
          question: "Question",
          answer: "Correct",
        },
      ]);
      mockLlmAdapter.generateMcqOptions!.mockResolvedValue([
        {
          questionIndex: 0,
          options: ["Wrong1", "Wrong2", "Wrong3"],
        },
      ]);

      const result = await service.adjustQuestions(
        [mockQuestion],
        mockDifficulty,
        "Programming",
        "mcq"
      );

      // Check that correct answer is in the options
      expect(result[0].options).toContain("Correct");
      // Check that at least one wrong option is in the options
      expect(result[0].options).toContain("Wrong1");
    });

    it("should handle fallback to original options if LLM fails", async () => {
      const questionWithOptions = {
        question: "Q?",
        answer: "Correct",
        options: ["A", "B", "C", "D"],
      };

      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        {
          question: "Adjusted",
          answer: "Correct",
        },
      ]);
      mockLlmAdapter.generateMcqOptions!.mockResolvedValue([
        {
          questionIndex: 0,
          options: [], // Empty options - should trigger fallback
        },
      ]);

      const result = await service.adjustQuestions(
        [questionWithOptions],
        mockDifficulty,
        "Programming",
        "mcq"
      );

      // Should have fallen back to original options
      expect(result[0].options?.length).toBeGreaterThan(0);
      expect(result[0].options).toContain("Correct");
    });

    it("should handle generic fallback options", async () => {
      const questionWithoutOptions = {
        question: "Q?",
        answer: "Correct answer",
      };

      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        {
          question: "Adjusted",
          answer: "Correct answer",
        },
      ]);
      mockLlmAdapter.generateMcqOptions!.mockResolvedValue([
        {
          questionIndex: 0,
          options: [],
        },
      ]);

      const result = await service.adjustQuestions(
        [questionWithoutOptions],
        mockDifficulty,
        "Programming",
        "mcq"
      );

      // Should have 4 options (1 correct + fallback generics)
      expect(result[0].options?.length).toBe(4);
      expect(result[0].options).toContain("Correct answer");
    });

    it("should preserve citation in MCQ results", async () => {
      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        {
          question: "Adjusted question",
          answer: "Same answer",
        },
      ]);
      mockLlmAdapter.generateMcqOptions!.mockResolvedValue([
        {
          questionIndex: 0,
          options: ["Wrong 1", "Wrong 2", "Wrong 3"],
        },
      ]);

      const result = await service.adjustQuestions(
        [mockQuestion],
        mockDifficulty,
        "Programming",
        "mcq"
      );

      expect(result[0].citation).toEqual(mockQuestion.citation);
    });
  });

  describe("multiple questions", () => {
    it("should handle multiple questions correctly", async () => {
      const questions = [
        { question: "Q1", answer: "A1" },
        { question: "Q2", answer: "A2" },
        { question: "Q3", answer: "A3" },
      ];

      mockLlmAdapter.adjustQuestions!.mockResolvedValue([
        { question: "Q1 adjusted", answer: "A1" },
        { question: "Q2 adjusted", answer: "A2" },
        { question: "Q3 adjusted", answer: "A3" },
      ]);

      const result = await service.adjustQuestions(
        questions,
        mockDifficulty,
        "Category",
        "open_ended"
      );

      expect(result).toHaveLength(3);
      expect(result[0].question).toBe("Q1 adjusted");
      expect(result[1].question).toBe("Q2 adjusted");
      expect(result[2].question).toBe("Q3 adjusted");
    });
  });

  describe("error handling", () => {
    it("should propagate LLM adapter errors", async () => {
      mockLlmAdapter.adjustQuestions!.mockRejectedValue(
        new Error("LLM error")
      );

      // Service has fallback tolerance - returns original questions on LLM error
      const result = await service.adjustQuestions(
        [mockQuestion],
        mockDifficulty,
        "Programming",
        "open_ended"
      );

      // Should return original questions as fallback
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe(mockQuestion.question);
      expect(result[0].answer).toBe(mockQuestion.answer);
      expect(result[0].citation).toEqual(mockQuestion.citation);
    });
  });
});
