import { generateQuestionsByTopic } from "@/server/services/questionGenerationService";
import * as gpt from "@/server/ai/gpt";

jest.setTimeout(45000);

describe("questionGenerationService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.OPENAI_QUESTION_MODELS;
  });

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

  it("accumulates open-ended AI questions across model attempts before fallback", async () => {
    process.env.OPENAI_QUESTION_MODELS = "model-a,model-b";

    const strictOutputSpy = jest
      .spyOn(gpt, "strict_output")
      .mockResolvedValueOnce([
        {
          question: "What does JSX compile to in React?",
          answer: "JavaScript function calls",
        },
      ])
      .mockResolvedValueOnce([
        {
          question: "Which hook stores local component state?",
          answer: "useState",
        },
      ]);

    const result = await generateQuestionsByTopic({
      amount: 2,
      topic: "react",
      type: "open_ended",
    });

    expect(strictOutputSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      {
        question: "What does JSX compile to in React?",
        answer: "JavaScript function calls",
      },
      {
        question: "Which hook stores local component state?",
        answer: "useState",
      },
    ]);
  });

  it("prompts open-ended generation for code or script execution results", async () => {
    const strictOutputSpy = jest
      .spyOn(gpt, "strict_output")
      .mockResolvedValueOnce([
        {
          question: "Run this script and type the exact output:\n\nconsole.log(\"react\".toUpperCase());",
          answer: "REACT",
        },
      ]);

    await generateQuestionsByTopic({
      amount: 1,
      topic: "react",
      type: "open_ended",
    });

    expect(strictOutputSpy).toHaveBeenCalled();
    const [systemPrompt, prompts, outputFormat] = strictOutputSpy.mock.calls[0];
    expect(String(systemPrompt)).toContain("code-style quiz pairs");
    expect(String(systemPrompt)).toContain("balanced mix");
    expect(String(prompts[0])).toContain("code-or-script question");
    expect(String(prompts[0])).toContain("exact execution result");
    expect(String(prompts[0])).toContain("[FILL_BLANK]");
    expect(outputFormat).toHaveProperty("question");
    expect(outputFormat).toHaveProperty("answer");
  });
});