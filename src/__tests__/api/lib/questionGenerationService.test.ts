import { strict_output } from "@/server/ai/gpt";
import { generateQuestionsByTopic } from "@/server/services/questionGenerationService";

jest.mock("@/server/ai/gpt", () => ({
  strict_output: jest.fn(),
}));

describe("questionGenerationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates open ended questions", async () => {
    (strict_output as jest.Mock).mockResolvedValue([{ question: "Q", answer: "A" }]);

    const result = await generateQuestionsByTopic({
      amount: 2,
      topic: "history",
      type: "open_ended",
    });

    expect(result).toHaveLength(1);
    expect(strict_output).toHaveBeenCalledTimes(1);
    const [, prompts] = (strict_output as jest.Mock).mock.calls[0];
    expect(Array.isArray(prompts)).toBe(true);
    expect(prompts).toHaveLength(2);
  });

  it("generates mcq questions", async () => {
    (strict_output as jest.Mock).mockResolvedValue([
      {
        question: "Q",
        answer: "A",
        option1: "B",
        option2: "C",
        option3: "D",
      },
    ]);

    const result = await generateQuestionsByTopic({
      amount: 1,
      topic: "math",
      type: "mcq",
    });

    expect(result).toHaveLength(1);
    expect(strict_output).toHaveBeenCalledTimes(1);
    const [, promptArray, outputFormat] = (strict_output as jest.Mock).mock.calls[0];
    expect(promptArray[0]).toContain("Generate 1 random hard mcq questions about math");
    expect(outputFormat).toEqual(
      expect.objectContaining({ option1: expect.any(String), option2: expect.any(String) }),
    );
  });
});