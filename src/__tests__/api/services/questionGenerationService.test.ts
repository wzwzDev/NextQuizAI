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
});