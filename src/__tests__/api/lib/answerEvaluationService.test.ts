jest.mock("@/lib/openaiClient", () => ({
  canUseEmbeddings: jest.fn(),
  getEmbedding: jest.fn(),
}));

import {
  cosineSimilarity,
  evaluateOpenEndedSimilarity,
} from "@/lib/services/answerEvaluationService";
import { canUseEmbeddings, getEmbedding } from "@/lib/openaiClient";

const mockedCanUseEmbeddings = canUseEmbeddings as jest.Mock;
const mockedGetEmbedding = getEmbedding as jest.Mock;

describe("answerEvaluationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("cosineSimilarity", () => {
    it("returns 1 for identical vectors", () => {
      expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
    });

    it("returns 0 for orthogonal vectors", () => {
      expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    });

    it("returns 0 for size mismatch", () => {
      expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });
  });

  describe("evaluateOpenEndedSimilarity", () => {
    it("uses semantic grading when embeddings are enabled", async () => {
      mockedCanUseEmbeddings.mockReturnValue(true);
      mockedGetEmbedding
        .mockResolvedValueOnce([1, 0])
        .mockResolvedValueOnce([0.99, 0.1]);

      const result = await evaluateOpenEndedSimilarity(
        "The sky is blue",
        "Sky appears blue",
      );

      expect(result.gradingMethod).toBe("semantic");
      expect(result.percentageSimilar).toBeGreaterThan(0);
      expect(mockedGetEmbedding).toHaveBeenCalledTimes(2);
    });

    it("falls back to lexical grading when embeddings fail", async () => {
      mockedCanUseEmbeddings.mockReturnValue(true);
      mockedGetEmbedding.mockRejectedValue(new Error("OpenAI unavailable"));

      const result = await evaluateOpenEndedSimilarity(
        "The sky is blue.",
        "The sky is blue.",
      );

      expect(result.gradingMethod).toBe("lexical_fallback");
      expect(result.percentageSimilar).toBe(100);
    });

    it("uses lexical grading when embeddings are disabled", async () => {
      mockedCanUseEmbeddings.mockReturnValue(false);

      const result = await evaluateOpenEndedSimilarity(
        "The sky is blue.",
        "Banana",
      );

      expect(result.gradingMethod).toBe("lexical_fallback");
      expect(result.percentageSimilar).toBe(0);
    });
  });
});
