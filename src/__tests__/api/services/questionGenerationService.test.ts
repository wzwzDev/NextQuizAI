import { generateQuestionsByTopic } from "@/server/services/questionGenerationService";

jest.setTimeout(45000);

describe("questionGenerationService", () => {
  it("returns open-ended questions even when AI dependency fails", async () => {
    const result = await generateQuestionsByTopic({
      amount: 1,
      topic: "history",
      type: "open_ended",
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("question");
    expect(result[0]).toHaveProperty("answer");
  });

  it("returns clean generic fallback MCQ when AI is unavailable", async () => {
    const previousApiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const result = await generateQuestionsByTopic({
        amount: 1,
        topic: "react",
        type: "mcq",
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      const first = result[0] as Record<string, unknown>;
      expect(typeof first.question).toBe("string");
      expect(String(first.question).toLowerCase()).toContain("react");
      expect(typeof first.option1).toBe("string");
      expect(typeof first.option2).toBe("string");
      expect(String(first.option1).toLowerCase()).not.toContain("myth");
      expect(String(first.option2).toLowerCase()).not.toContain("pattern");
    } finally {
      if (previousApiKey) {
        process.env.OPENAI_API_KEY = previousApiKey;
      }
    }
  });
});