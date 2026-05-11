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
      expect(String(first.question).toLowerCase()).not.toContain("associated with");
      expect(String(first.question).toLowerCase()).not.toContain("generally true");
      expect(String(first.question).toLowerCase()).toMatch(
        /syntax|runtime behavior|type system|packages or modules|functions or methods|error handling|data structures|best practices/,
      );
      expect(typeof first.option1).toBe("string");
      expect(typeof first.option2).toBe("string");
      expect(typeof first.option3).toBe("string");
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

  it("prompts open-ended generation as a code-and-general mix", async () => {
    const strictOutputSpy = jest
      .spyOn(gpt, "strict_output")
      .mockResolvedValueOnce([
        {
          question: "What does console.log(\"react\".toUpperCase()) print?",
          answer: "REACT",
        },
        {
          question: "What does console.log(1 + 1) print?",
          answer: "2",
        },
        {
          question: "What is React mainly used for?",
          answer: "Building user interfaces",
        },
        {
          question: "Name one concept React relies on.",
          answer: "Components",
        },
      ]);

    await generateQuestionsByTopic({
      amount: 4,
      topic: "react",
      type: "open_ended",
    });

    expect(strictOutputSpy).toHaveBeenCalled();
    const [systemPrompt, prompts, outputFormat] = strictOutputSpy.mock.calls[0];
    expect(String(systemPrompt)).toContain("open-ended quiz pairs");
    expect(String(systemPrompt)).toContain("exact mix requested by each prompt");
    expect(String(prompts[0])).toContain("code-style question");
    expect(String(prompts[1])).toContain("code-style question");
    expect(String(prompts[2])).toContain("general knowledge question");
    expect(String(prompts[3])).toContain("general knowledge question");
    expect(String(prompts[0])).toContain("[FILL_BLANK]");
    expect(String(prompts[1])).toContain("exact execution result");
    expect(String(prompts[2])).toContain("concise factual answer");
    expect(String(prompts[3])).toContain("concise factual answer");
    expect(outputFormat).toHaveProperty("question");
    expect(outputFormat).toHaveProperty("answer");
  });

  it("prompts mcq generation with topic-specific focus areas", async () => {
    const strictOutputSpy = jest.spyOn(gpt, "strict_output").mockResolvedValueOnce([
      {
        question: "Which statement best describes Java syntax?",
        answer: "Java syntax defines how code is written",
        option1: "Java syntax ignores structure",
        option2: "Java syntax is unrelated to code",
        option3: "Java syntax only applies to databases",
      },
    ]);

    await generateQuestionsByTopic({
      amount: 1,
      topic: "Java",
      type: "mcq",
    });

    expect(strictOutputSpy).toHaveBeenCalled();
    const [systemPrompt, prompts] = strictOutputSpy.mock.calls[0];
    expect(String(systemPrompt)).toContain("generate 1 mcq questions and answers about Java");
    expect(String(prompts[0])).toContain("Focus area:");
    expect(String(prompts[0])).toContain("Java syntax");
    strictOutputSpy.mockRestore();
  });

  it("falls back to a mixed set when open-ended generation fails", async () => {
    jest.spyOn(gpt, "strict_output").mockRejectedValueOnce(new Error("boom"));

    const result = await generateQuestionsByTopic({
      amount: 3,
      topic: "react",
      type: "open_ended",
    });

    expect(result).toHaveLength(3);
    // Verify fallback questions are generated with reasonable content
    expect(result[0].question).toBeTruthy();
    expect(result[0].question.length).toBeGreaterThan(10);
    expect(result[1].question).toBeTruthy();
    expect(result[2].question).toBeTruthy();
  });
});