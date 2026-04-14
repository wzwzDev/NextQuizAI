import { generateQuestionsByTopic } from "@/server/services/questionGenerationService";

jest.setTimeout(45000);

describe("questionGenerationService", () => {
  it("handles open-ended generation using real dependency", async () => {
    if (!process.env.OPENAI_API_KEY) {
      await expect(
        generateQuestionsByTopic({
          amount: 1,
          topic: "history",
          type: "open_ended",
        }),
      ).rejects.toThrow(/OPENAI_API_KEY/i);
      return;
    }

    const result = await generateQuestionsByTopic({
      amount: 1,
      topic: "history",
      type: "open_ended",
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("question");
    expect(result[0]).toHaveProperty("answer");
  });
});