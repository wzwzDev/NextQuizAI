import { strict_output } from "@/server/ai/gptadmin";

jest.setTimeout(45000);

describe("gptadmin.strict_output", () => {
  const originalOpenAIKey = process.env.OPENAI_API_KEY;

  afterAll(() => {
    if (typeof originalOpenAIKey === "string") {
      process.env.OPENAI_API_KEY = originalOpenAIKey;
      return;
    }

    delete process.env.OPENAI_API_KEY;
  });

  it("throws when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      strict_output(
        "system",
        "user",
        { question: "", answer: "" },
        "",
        false,
        "gpt-4o-mini",
        0,
        1,
        false,
      ),
    ).rejects.toThrow(/OPENAI_API_KEY/i);
  });

  it("can execute with real OpenAI when key is present", async () => {
    if (!originalOpenAIKey) {
      return;
    }

    process.env.OPENAI_API_KEY = originalOpenAIKey;
    const result = await strict_output(
      "Return concise output.",
      "Generate one short question-answer pair.",
      { question: "", answer: "" },
      "",
      false,
      "gpt-4o-mini",
      0,
      1,
      false,
    );

    expect(result).toBeDefined();
  });
});