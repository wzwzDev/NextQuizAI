import {
  cosineSimilarity,
  evaluateOpenEndedSimilarity,
} from "@/server/services/answerEvaluationService";

describe("answerEvaluationService", () => {
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
    it("returns exact match for identical answers", async () => {
      const result = await evaluateOpenEndedSimilarity(
        "console.log(2 + 2)",
        "console.log(2 + 2)",
      );

      expect(result.gradingMethod).toBe("exact_match");
      expect(result.percentageSimilar).toBe(100);
    });

    it("accepts close misspellings as typo tolerant", async () => {
      const result = await evaluateOpenEndedSimilarity("javascript", "javscript");

      expect(result.gradingMethod).toBe("typo_tolerant");
      expect(result.percentageSimilar).toBe(100);
    });

    it("accepts adjacent character swaps as typo tolerant", async () => {
      const result = await evaluateOpenEndedSimilarity("return", "retrun");

      expect(result.gradingMethod).toBe("typo_tolerant");
      expect(result.percentageSimilar).toBe(100);
    });

    it("accepts answers that contain the expected phrase", async () => {
      const result = await evaluateOpenEndedSimilarity(
        "transformer",
        "transformer architecture",
      );

      expect(result.gradingMethod).toBe("typo_tolerant");
      expect(result.percentageSimilar).toBe(100);
    });

    it("accepts output-label variants for fill-blank answers", async () => {
      const result = await evaluateOpenEndedSimilarity(
        "Output: PYTHON",
        "PYTHON",
      );

      expect(result.gradingMethod).toBe("exact_match");
      expect(result.percentageSimilar).toBe(100);
    });

    it("accepts quoted output values", async () => {
      const result = await evaluateOpenEndedSimilarity('"PYTHON"', "PYTHON");

      expect(result.gradingMethod).toBe("exact_match");
      expect(result.percentageSimilar).toBe(100);
    });

    it("rejects unrelated answers", async () => {
      const result = await evaluateOpenEndedSimilarity(
        "forEach",
        "Banana",
      );

      expect(result.gradingMethod).toBe("typo_tolerant");
      expect(result.percentageSimilar).toBe(0);
    });
  });
});
