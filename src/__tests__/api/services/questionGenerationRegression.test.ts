import { generateQuestionsByTopic } from "@/server/services/questionGenerationService";

describe("Question Generation Regression Tests", () => {
  jest.setTimeout(60000);

  it("should generate code-output questions with [FILL_BLANK] marker", async () => {
    const result = await generateQuestionsByTopic({
      amount: 5,
      topic: "JavaScript",
      type: "open_ended",
    });

    expect(result).toHaveLength(5);

    const codeQuestions = result.filter(
      (q) =>
        q.question.includes("\n") ||
        q.question.toLowerCase().includes("console.log") ||
        q.question.toLowerCase().includes("output:")
    );

    codeQuestions.forEach((q) => {
      const hasFillBlank = /\[fill_blank\]/i.test(q.question);
      const hasOutputMarker = /output:\s*_{3,}/i.test(q.question);
      expect(hasFillBlank || hasOutputMarker).toBe(true);
    });
  });

  it("should ensure all code questions have proper output marker", async () => {
    const result = await generateQuestionsByTopic({
      amount: 3,
      topic: "Python",
      type: "open_ended",
    });

    const codeQuestions = result.filter((q) => q.question.includes("\n"));

    codeQuestions.forEach((q) => {
      const hasOutputMarker = /output:\s*_{3,}/i.test(q.question);
      expect(hasOutputMarker).toBe(true);
    });
  });

  it("should generate valid questions with non-empty content", async () => {
    const result = await generateQuestionsByTopic({
      amount: 4,
      topic: "Web Development",
      type: "open_ended",
    });

    result.forEach((q) => {
      expect(q.question).toBeTruthy();
      expect(q.question.length).toBeGreaterThan(5);
      expect(q.answer).toBeTruthy();
      expect(q.answer.length).toBeGreaterThan(0);
    });
  });

  it("should maintain wrapper format consistency across batches", async () => {
    const batch1 = await generateQuestionsByTopic({
      amount: 2,
      topic: "React",
      type: "open_ended",
    });

    const batch2 = await generateQuestionsByTopic({
      amount: 2,
      topic: "React",
      type: "open_ended",
    });

    const allQuestions = [...batch1, ...batch2];
    const codeQuestions = allQuestions.filter((q) => q.question.includes("\n"));

    codeQuestions.forEach((q) => {
      const isWellFormatted =
        /\[fill_blank\]/i.test(q.question) ||
        /output:\s*_{3,}/i.test(q.question) ||
        (q.question.includes("\n") && q.question.includes("console.log"));

      expect(isWellFormatted).toBe(true);
    });
  });

  it("should handle fallback questions with proper wrapper format", async () => {
    const result = await generateQuestionsByTopic({
      amount: 10,
      topic: "Testing Edge Cases",
      type: "open_ended",
    });

    expect(result.length).toBeGreaterThan(0);

    result.forEach((q) => {
      expect(q.question).toBeTruthy();
      expect(q.answer).toBeTruthy();

      if (
        q.question.includes("\n") ||
        /\bfunction\b|\bconsole\.log\b|\bconst\b|\blet\b/.test(q.question)
      ) {
        const hasProperFormat =
          /\[fill_blank\]/i.test(q.question) ||
          /output:\s*_{3,}/i.test(q.question);
        expect(hasProperFormat).toBe(true);
      }
    });
  });

  it("should not include duplicate questions", async () => {
    const result = await generateQuestionsByTopic({
      amount: 5,
      topic: "Unique Topic for Dedup Test",
      type: "open_ended",
    });

    const questionTexts = result.map((q) => q.question.toLowerCase());
    const uniqueQuestions = new Set(questionTexts);

    expect(uniqueQuestions.size).toBe(result.length);
  });
});
