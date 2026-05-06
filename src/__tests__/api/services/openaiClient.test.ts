jest.mock("openai", () => {
  const ctor = jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
    },
  }));

  return {
    __esModule: true,
    default: ctor,
  };
});

describe("openaiClient", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("throws when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const mod = await import("@/server/ai/openaiClient");
    expect(() => mod.getOpenAIClient()).toThrow(/OPENAI_API_KEY/i);
  });

  it("returns cached client and supports base URL reconfiguration", async () => {
    process.env.OPENAI_API_KEY = "key-1";
    process.env.OPENAI_BASE_URL = "https://example.openai.local";

    const OpenAI = (await import("openai")).default as unknown as jest.Mock;
    const mod = await import("@/server/ai/openaiClient");
    const first = mod.getOpenAIClient();
    const second = mod.getOpenAIClient();

    expect(first).toBe(second);
    expect(OpenAI).toHaveBeenCalledTimes(1);

    process.env.OPENAI_BASE_URL = "https://other.openai.local";
    const third = mod.getOpenAIClient();
    expect(third).not.toBe(first);
    expect(OpenAI).toHaveBeenCalledTimes(2);
  });

  it("canUseEmbeddings respects api key and disable flag", async () => {
    const mod = await import("@/server/ai/openaiClient");

    delete process.env.OPENAI_API_KEY;
    process.env.DISABLE_SEMANTIC_GRADING = "false";
    expect(mod.canUseEmbeddings()).toBe(false);

    process.env.OPENAI_API_KEY = "k";
    process.env.DISABLE_SEMANTIC_GRADING = "true";
    expect(mod.canUseEmbeddings()).toBe(false);

    process.env.DISABLE_SEMANTIC_GRADING = "false";
    expect(mod.canUseEmbeddings()).toBe(true);
  });

  it("returns embedding and throws if embedding is missing", async () => {
    process.env.OPENAI_API_KEY = "k";
    const mod = await import("@/server/ai/openaiClient");
    const OpenAI = (await import("openai")).default as unknown as jest.Mock;

    const embedding = await mod.getEmbedding("hello");
    expect(embedding).toEqual([0.1, 0.2, 0.3]);

    const instance = OpenAI.mock.results[0].value;
    instance.embeddings.create.mockResolvedValueOnce({ data: [] });

    await expect(mod.getEmbedding("x")).rejects.toThrow(/No embedding returned/i);
  });
});
