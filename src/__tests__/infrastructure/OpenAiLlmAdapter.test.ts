import { OpenAiLlmAdapter } from "@/infrastructure/llm/OpenAiLlmAdapter";
import * as gptadminModule from "@/server/ai/gptadmin";

// Mock the OpenAI client
jest.mock("@/server/ai/gptadmin", () => ({
  getOpenAIClient: jest.fn(),
}));

describe("OpenAiLlmAdapter", () => {
  let adapter: OpenAiLlmAdapter;
  let mockOpenAIClient: any;

  beforeEach(() => {
    adapter = new OpenAiLlmAdapter();
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };
    (gptadminModule.getOpenAIClient as jest.Mock).mockReturnValue(
      mockOpenAIClient
    );
  });

  describe("adjustQuestions", () => {
    it("should successfully adjust questions with valid response", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  { question: "What is 2+2?", answer: "4" },
                  { question: "What is 3+3?", answer: "6" },
                ],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      const result = await adapter.adjustQuestions(
        "Adjust these questions",
        2
      );

      expect(result).toHaveLength(2);
      expect(result[0].question).toBe("What is 2+2?");
      expect(result[0].answer).toBe("4");
    });

    it("should handle missing questions array in response", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                someOtherField: [],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.adjustQuestions("Adjust questions", 2)
      ).rejects.toThrow("Invalid response format: missing questions array");
    });

    it("should handle empty questions array", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.adjustQuestions("Adjust questions", 2)
      ).rejects.toThrow("Invalid response format: missing questions array");
    });

    it("should warn when question count mismatch", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [{ question: "Q1?", answer: "A1" }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await adapter.adjustQuestions("Adjust questions", 2);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Expected 2 questions but got 1")
      );
      consoleSpy.mockRestore();
    });

    it("should throw when question is missing answer field", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [{ question: "Q1?" }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.adjustQuestions("Adjust questions", 1)
      ).rejects.toThrow("Invalid question format: missing question or answer");
    });

    it("should throw when question is missing question field", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [{ answer: "A1" }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.adjustQuestions("Adjust questions", 1)
      ).rejects.toThrow("Invalid question format: missing question or answer");
    });

    it("should handle JSON parsing error from LLM", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "{ invalid json",
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.adjustQuestions("Adjust questions", 1)
      ).rejects.toThrow("Failed to adjust questions");
    });

    it("should handle empty LLM response", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.adjustQuestions("Adjust questions", 1)
      ).rejects.toThrow("Failed to adjust questions");
    });
  });

  describe("generateMcqOptions", () => {
    it("should successfully generate MCQ options", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                options: [
                  { questionIndex: 0, options: ["A", "B", "C", "D"] },
                  { questionIndex: 1, options: ["X", "Y", "Z", "W"] },
                ],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      const result = await adapter.generateMcqOptions(
        "Generate options",
        2
      );

      expect(result).toHaveLength(2);
      expect(result[0].questionIndex).toBe(0);
      expect(result[0].options).toEqual(["A", "B", "C", "D"]);
    });

    it("should handle missing options array in response", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                someOtherField: [],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.generateMcqOptions("Generate options", 2)
      ).rejects.toThrow("Invalid response format: missing options array");
    });

    it("should warn when options count mismatch", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                options: [{ questionIndex: 0, options: ["A", "B"] }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await adapter.generateMcqOptions("Generate options", 2);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Expected options for 2 questions but got 1")
      );
      consoleSpy.mockRestore();
    });

    it("should throw when option has non-number questionIndex", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                options: [{ questionIndex: "not-a-number", options: ["A"] }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.generateMcqOptions("Generate options", 1)
      ).rejects.toThrow("Invalid option format");
    });

    it("should throw when option has non-array options", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                options: [{ questionIndex: 0, options: "not-an-array" }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.generateMcqOptions("Generate options", 1)
      ).rejects.toThrow("Invalid option format");
    });

    it("should throw when option has empty array", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                options: [{ questionIndex: 0, options: [] }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse
      );

      await expect(
        adapter.generateMcqOptions("Generate options", 1)
      ).rejects.toThrow("Invalid option format");
    });
  });

  describe("Error Handling and Retries", () => {
    it("should handle API error on first attempt and fail", async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValueOnce(
        new Error("API Error")
      );

      await expect(
        adapter.adjustQuestions("Adjust", 1)
      ).rejects.toThrow("Failed to adjust questions");
    });

    it("should handle multiple API errors and eventually fail", async () => {
      mockOpenAIClient.chat.completions.create
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"))
        .mockRejectedValueOnce(new Error("Error 3"));

      await expect(
        adapter.adjustQuestions("Adjust", 1)
      ).rejects.toThrow("Failed to adjust questions");
    });

    it("should retry on rate limit error (429) and eventually succeed", async () => {
      const successResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [{ question: "Q1?", answer: "A1" }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create
        .mockRejectedValueOnce(new Error("429 Too many requests"))
        .mockResolvedValueOnce(successResponse);

      const result = await adapter.adjustQuestions("Adjust", 1);
      
      expect(result).toHaveLength(1);
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    it("should retry on rate_limit_error and eventually succeed", async () => {
      const successResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [{ question: "Q1?", answer: "A1" }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create
        .mockRejectedValueOnce(new Error("rate_limit_error: too many requests"))
        .mockResolvedValueOnce(successResponse);

      const result = await adapter.adjustQuestions("Adjust", 1);
      
      expect(result).toHaveLength(1);
    });

    it("should handle JSON parse error and eventually succeed", async () => {
      const successResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [{ question: "Q1?", answer: "A1" }],
              }),
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create
        .mockRejectedValueOnce(new Error("Unexpected token"))
        .mockResolvedValueOnce(successResponse);

      const result = await adapter.adjustQuestions("Adjust", 1);
      
      expect(result).toHaveLength(1);
    });

    it("should handle missing choices in response", async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValueOnce({
        choices: [],
      });

      await expect(
        adapter.adjustQuestions("Adjust", 1)
      ).rejects.toThrow("Failed to adjust questions");
    });
  });
});
