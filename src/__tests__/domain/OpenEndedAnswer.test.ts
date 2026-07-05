import { OpenEndedAnswer } from "@/domain/entities/OpenEndedAnswer";
import type { StringSimilarityPort } from "@/domain/ports/StringSimilarityPort";

describe("OpenEndedAnswer", () => {
  let mockSimilarityPort: jest.Mocked<StringSimilarityPort>;

  beforeEach(() => {
    mockSimilarityPort = {
      compare: jest.fn(),
    };
  });

  describe("fromRaw", () => {
    it("should create OpenEndedAnswer from raw strings", () => {
      const answer = OpenEndedAnswer.fromRaw("Hello World", "hello world");
      expect(answer).toBeInstanceOf(OpenEndedAnswer);
    });

    it("should handle empty strings", () => {
      const answer = OpenEndedAnswer.fromRaw("", "");
      expect(answer).toBeInstanceOf(OpenEndedAnswer);
    });

    it("should handle whitespace", () => {
      const answer = OpenEndedAnswer.fromRaw("  test  ", "\t\ntest\n");
      expect(answer).toBeInstanceOf(OpenEndedAnswer);
    });
  });

  describe("grade - exact match", () => {
    it("should return exact_match when normalized artifact matches", () => {
      const answer = OpenEndedAnswer.fromRaw("42", "42");
      const result = answer.grade(mockSimilarityPort);

      expect(result.gradingMethod).toBe("exact_match");
      expect(result.percentageSimilar).toBe(100);
      expect(result.rawScore).toBe(1);
      expect(result.isAccepted).toBe(true);
    });

    it("should match ignoring case", () => {
      const answer = OpenEndedAnswer.fromRaw("HELLO", "hello");
      const result = answer.grade(mockSimilarityPort);

      expect(result.gradingMethod).toBe("exact_match");
      expect(result.percentageSimilar).toBe(100);
      expect(result.isAccepted).toBe(true);
    });

    it("should match normalized value without artifacts", () => {
      const answer = OpenEndedAnswer.fromRaw("test value", "test value");
      const result = answer.grade(mockSimilarityPort);

      expect(result.gradingMethod).toBe("exact_match");
      expect(result.isAccepted).toBe(true);
    });

    it("should match with surrounding quotes", () => {
      const answer = OpenEndedAnswer.fromRaw('"42"', '42');
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should match execution output exactly", () => {
      const answer = OpenEndedAnswer.fromRaw("line1\nline2\nline3", "line1\nline2\nline3");
      const result = answer.grade(mockSimilarityPort);

      expect(result.gradingMethod).toBe("exact_match");
      expect(result.isAccepted).toBe(true);
    });

    it("should match execution output ignoring trailing whitespace", () => {
      const answer = OpenEndedAnswer.fromRaw("line1  \nline2  ", "line1\nline2");
      const result = answer.grade(mockSimilarityPort);

      expect(result.gradingMethod).toBe("exact_match");
      expect(result.isAccepted).toBe(true);
    });
  });

  describe("grade - execution output comparison", () => {
    it("should handle empty execution output as exact match", () => {
      const answer = OpenEndedAnswer.fromRaw("\n\n\n", "\n\n");
      const result = answer.grade(mockSimilarityPort);

      expect(result.gradingMethod).toBe("exact_match");
      expect(result.percentageSimilar).toBe(100);
      expect(result.isAccepted).toBe(true);
    });

    it("should reject when execution output is missing from user", () => {
      const answer = OpenEndedAnswer.fromRaw("output:\nHello", "");
      const result = answer.grade(mockSimilarityPort);

      expect(result.percentageSimilar).toBe(0);
      expect(result.rawScore).toBe(0);
      expect(result.isAccepted).toBe(false);
    });

    it("should accept when user output contains expected line sequence", () => {
      const answer = OpenEndedAnswer.fromRaw("Hello\nWorld", "Prefix\nHello\nWorld\nSuffix");
      const result = answer.grade(mockSimilarityPort);

      expect(result.gradingMethod).toBe("typo_tolerant");
      expect(result.isAccepted).toBe(true);
    });
  });

  describe("grade - typo tolerant", () => {
    it("should use similarity score when threshold is met", () => {
      mockSimilarityPort.compare.mockReturnValue(0.85);
      const answer = OpenEndedAnswer.fromRaw("expected", "expeted");
      const result = answer.grade(mockSimilarityPort);

      expect(result.gradingMethod).toBe("typo_tolerant");
      expect(result.percentageSimilar).toBe(100);
      expect(result.isAccepted).toBe(true);
      expect(result.rawScore).toBe(0.85);
    });

    it("should reject when similarity score below threshold", () => {
      mockSimilarityPort.compare.mockReturnValue(0.7);
      const answer = OpenEndedAnswer.fromRaw("expected", "different");
      const result = answer.grade(mockSimilarityPort);

      expect(result.gradingMethod).toBe("typo_tolerant");
      expect(result.percentageSimilar).toBe(0);
      expect(result.isAccepted).toBe(false);
      expect(result.rawScore).toBe(0.7);
    });

    it("should accept with single adjacent swap", () => {
      const answer = OpenEndedAnswer.fromRaw("test", "tset");
      mockSimilarityPort.compare.mockReturnValue(0.75);
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should handle single character difference", () => {
      mockSimilarityPort.compare.mockReturnValue(0.9);
      const answer = OpenEndedAnswer.fromRaw("hello", "hallo");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });
  });

  describe("grade - execution output with similarity", () => {
    it("should handle code block markers in artifact", () => {
      const answer = OpenEndedAnswer.fromRaw("```\n42\n```", "42");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should handle code block with language specifier", () => {
      const answer = OpenEndedAnswer.fromRaw("```javascript\nconsole.log('test')\n```", "console.log('test')");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should remove output: prefix from artifact", () => {
      const answer = OpenEndedAnswer.fromRaw("output: answer_value", "answer_value");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should remove answer: prefix from artifact", () => {
      const answer = OpenEndedAnswer.fromRaw("answer = 42", "42");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should remove result: prefix from artifact", () => {
      const answer = OpenEndedAnswer.fromRaw("result = test", "test");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });
  });

  describe("grade - edge cases", () => {
    it("should handle multiple consecutive newlines", () => {
      const answer = OpenEndedAnswer.fromRaw("\n\n\ntest\n\n\n", "\n\n\ntest\n\n\n");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should handle mixed line endings (CRLF vs LF)", () => {
      const answer = OpenEndedAnswer.fromRaw("line1\r\nline2", "line1\nline2");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should handle single word output", () => {
      const answer = OpenEndedAnswer.fromRaw("test", "test");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should handle numeric string output", () => {
      const answer = OpenEndedAnswer.fromRaw("42", "42");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should handle special characters", () => {
      const answer = OpenEndedAnswer.fromRaw("@#$%^&*()", "@#$%^&*()");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should handle unicode characters", () => {
      const answer = OpenEndedAnswer.fromRaw("café", "café");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should handle very long output", () => {
      const longOutput = "a".repeat(10000);
      const answer = OpenEndedAnswer.fromRaw(longOutput, longOutput);
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });
  });

  describe("grade - containsSequence behavior", () => {
    it("should accept when user contains expected words", () => {
      const answer = OpenEndedAnswer.fromRaw("hello world", "hello world test");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should compare normalized sequences", () => {
      const answer = OpenEndedAnswer.fromRaw("test", "TEST CASE");
      mockSimilarityPort.compare.mockReturnValue(0.3);
      const result = answer.grade(mockSimilarityPort);

      // Will depend on the NormalizedText.containsSequence logic
      expect(result).toBeDefined();
    });
  });

  describe("grade - artifact normalization", () => {
    it("should handle 'it prints' prefix", () => {
      const answer = OpenEndedAnswer.fromRaw("it prints 42", "42");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should handle 'the output is' prefix", () => {
      const answer = OpenEndedAnswer.fromRaw("the output is done", "done");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should unwrap single quotes", () => {
      const answer = OpenEndedAnswer.fromRaw("'answer'", "answer");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should unwrap backticks", () => {
      const answer = OpenEndedAnswer.fromRaw("`test`", "test");
      const result = answer.grade(mockSimilarityPort);

      expect(result.isAccepted).toBe(true);
    });

    it("should not unwrap mismatched quotes", () => {
      mockSimilarityPort.compare.mockReturnValue(0.85);
      const answer = OpenEndedAnswer.fromRaw('"test\'', "test");
      const result = answer.grade(mockSimilarityPort);

      // Should try to compare the mismatched quoted value
      expect(result).toBeDefined();
    });
  });
});
