import * as gpt from "@/server/ai/gpt";

jest.setTimeout(45000);

describe("gpt.strict_output", () => {
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;

  afterAll(() => {
    if (typeof originalOpenAiApiKey === "string") {
      process.env.OPENAI_API_KEY = originalOpenAiApiKey;
      return;
    }

    delete process.env.OPENAI_API_KEY;
  });

  it("throws when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      gpt.strict_output(
        "system",
        "user",
        { question: "", answer: "" },
        "",
        false,
        "gpt-3.5-turbo",
        0,
        1,
        false,
      ),
    ).rejects.toThrow(/OPENAI_API_KEY/i);
  });

  it("can execute with real OpenAI when key is present", async () => {
    if (!originalOpenAiApiKey) {
      return;
    }

    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    const result = await gpt.strict_output(
      "Return concise output.",
      "Give one easy math question and short answer.",
      { question: "", answer: "" },
      "",
      false,
      "gpt-3.5-turbo",
      0,
      1,
      false,
    );

    expect(result).toBeDefined();
  });
});