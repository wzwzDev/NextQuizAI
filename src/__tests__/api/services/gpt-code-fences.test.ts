const mockCreate = jest.fn();

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe("GPT fenced JSON parsing", () => {
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    mockCreate.mockReset();
  });

  afterAll(() => {
    if (typeof originalOpenAiApiKey === "string") {
      process.env.OPENAI_API_KEY = originalOpenAiApiKey;
      return;
    }

    delete process.env.OPENAI_API_KEY;
  });

  it("strips fenced JSON in gpt.strict_output", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: '```json\n{"answer":"ok"}\n```',
          },
        },
      ],
    });

    const { strict_output } = await import("@/server/ai/gpt");

    const result = await strict_output(
      "system",
      "user",
      { answer: "" },
      "",
      false,
      "gpt-3.5-turbo",
      0,
      1,
      false,
    );

    expect(result).toEqual({ answer: "ok" });
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("strips fenced JSON in gptadmin.strict_output", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: '```json\n[{"answer":"ok"}]\n```',
          },
        },
      ],
    });

    const { strict_output } = await import("@/server/ai/gptadmin");

    const result = await strict_output(
      "system",
      "user",
      { answer: "" },
      "",
      false,
      "gpt-3.5-turbo",
      0,
      1,
      false,
    );

    expect(result).toEqual([{ answer: "ok" }]);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});