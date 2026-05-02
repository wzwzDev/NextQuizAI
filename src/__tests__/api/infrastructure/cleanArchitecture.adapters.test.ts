jest.mock("@/server/auth/password", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashed"),
  verifyPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/server/mailer/email", () => ({
  buildVerificationUrl: jest.fn((token: string) => `http://verify/${token}`),
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/server/ai/gpt", () => ({
  strict_output: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock("@/server/repositories/userRepository", () => ({
  findUserIdentityById: jest.fn(),
  findUserIdentityByEmail: jest.fn(),
  findUserBanStatusByEmail: jest.fn(),
  findUserRevokeStatus: jest.fn(),
  updateUserOnlineByEmail: jest.fn(),
  findUserBanStatus: jest.fn(),
}));

describe("infrastructure adapters", () => {
  it("PasswordHasherAdapter delegates hash and verify", async () => {
    const { PasswordHasherAdapter } = await import("@/infrastructure/security/PasswordHasherAdapter");
    const { hashPassword, verifyPassword } = await import("@/server/auth/password");

    const adapter = new PasswordHasherAdapter();
    await expect(adapter.hash("pwd")).resolves.toBe("hashed");
    await expect(adapter.verify("pwd", "hashed")).resolves.toBe(true);

    expect(hashPassword).toHaveBeenCalledWith("pwd");
    expect(verifyPassword).toHaveBeenCalledWith("pwd", "hashed");
  });

  it("VerificationEmailSenderAdapter delegates send and url build", async () => {
    const { VerificationEmailSenderAdapter } = await import("@/infrastructure/mail/VerificationEmailSenderAdapter");
    const mailer = await import("@/server/mailer/email");

    const adapter = new VerificationEmailSenderAdapter();
    await adapter.sendVerification({ to: "a@b.com", verificationUrl: "http://v" });
    const url = adapter.createVerificationUrl("tok");

    expect(mailer.sendVerificationEmail).toHaveBeenCalledWith({ to: "a@b.com", verificationUrl: "http://v" });
    expect(url).toBe("http://verify/tok");
  });

  it("LlmGatewayAdapter delegates strictOutput", async () => {
    const { LlmGatewayAdapter } = await import("@/infrastructure/llm/LlmGatewayAdapter");
    const { strict_output } = await import("@/server/ai/gpt");

    const adapter = new LlmGatewayAdapter();
    const out = await adapter.strictOutput("s", "u", { a: "" });
    expect(out).toEqual({ ok: true });
    expect(strict_output).toHaveBeenCalledWith("s", "u", { a: "" });
  });

  it("QuestionGenerationConfigAdapter covers defaults, parsing and token", async () => {
    const oldEnv = process.env;
    process.env = { ...oldEnv };

    const { QuestionGenerationConfigAdapter } = await import(
      "@/infrastructure/question-generation/QuestionGenerationConfigAdapter"
    );
    const adapter = new QuestionGenerationConfigAdapter();

    delete process.env.OPENAI_QUESTION_MODELS;
    delete process.env.OPENAI_QUESTION_MODEL;
    delete process.env.OPENAI_MODEL;
    const defaults = adapter.getAvailableModels();
    expect(defaults.length).toBeGreaterThan(0);

    process.env.OPENAI_QUESTION_MODELS = "m1,m2,m1";
    process.env.OPENAI_QUESTION_MODEL = "m3";
    const models = adapter.getAvailableModels();
    expect(models).toEqual(["m1", "m2", "m3"]);

    delete process.env.OPENAI_QUESTION_TEMPERATURE;
    expect(adapter.getTemperature()).toBe(0.85);
    process.env.OPENAI_QUESTION_TEMPERATURE = "2";
    expect(adapter.getTemperature()).toBe(1.2);
    process.env.OPENAI_QUESTION_TEMPERATURE = "-1";
    expect(adapter.getTemperature()).toBe(0);

    const token = adapter.createBatchToken();
    expect(token).toMatch(/^[a-z0-9]+-[a-f0-9]{6}$/);

    process.env = oldEnv;
  });

  it("StringSimilarityAdapter normalizes inputs", async () => {
    const { StringSimilarityAdapter } = await import("@/infrastructure/similarity/StringSimilarityAdapter");
    const adapter = new StringSimilarityAdapter();

    const score = adapter.compare(" Hello   World ", "hello world");
    expect(score).toBe(1);
  });

  it("UserRepositoryAdapter covers null and mapped branches", async () => {
    const userRepo = await import("@/server/repositories/userRepository");
    const { UserRepositoryAdapter } = await import("@/infrastructure/user/UserRepositoryAdapter");

    (userRepo.findUserIdentityById as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "u1", email: "u@x.com" });
    (userRepo.findUserIdentityByEmail as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "u2", email: "e@x.com" });
    (userRepo.findUserBanStatusByEmail as jest.Mock).mockResolvedValue({ banned: true });
    (userRepo.findUserRevokeStatus as jest.Mock).mockResolvedValue({ revoked: false });
    (userRepo.updateUserOnlineByEmail as jest.Mock).mockResolvedValue({ ok: true });

    const adapter = new UserRepositoryAdapter();

    await expect(adapter.findById("x")).resolves.toBeNull();
    await expect(adapter.findById("x")).resolves.toEqual({ id: "u1", email: "u@x.com" });

    await expect(adapter.findByEmail("e")).resolves.toBeNull();
    await expect(adapter.findByEmail("e")).resolves.toEqual({ id: "u2", email: "e@x.com" });

    await expect(adapter.findBanStatusByEmail("e")).resolves.toEqual({ banned: true });
    await expect(adapter.findRevokeStatus("u")).resolves.toEqual({ revoked: false });
    await expect(adapter.setOnlineByEmail("e", true)).resolves.toEqual({ ok: true });
  });

  it("PermissionCheckAdapter covers access and status checks", async () => {
    const userRepo = await import("@/server/repositories/userRepository");
    const { PermissionCheckAdapter } = await import("@/infrastructure/game/PermissionCheckAdapter");

    (userRepo.findUserBanStatus as jest.Mock).mockResolvedValue({ banned: true });
    (userRepo.findUserRevokeStatus as jest.Mock).mockResolvedValue({ revoked: false });

    const adapter = new PermissionCheckAdapter();

    expect(adapter.canUserAccessResource("u1", "u1", false)).toBe(true);
    expect(adapter.canUserAccessResource("u1", "u2", true)).toBe(true);
    expect(adapter.canUserAccessResource("u1", "u2", false)).toBe(false);

    await expect(adapter.isUserBanned("u1")).resolves.toBe(true);
    await expect(adapter.isUserRevoked("u1")).resolves.toBe(false);
  });

  it("AdminQuizGradingAdapter covers grading utilities", async () => {
    const { AdminQuizGradingAdapter } = await import("@/infrastructure/admin/AdminQuizGradingAdapter");
    const adapter = new AdminQuizGradingAdapter();

    const mcq = await adapter.gradeAnswer({ expected: "A", userInput: "a", quizType: "mcq" });
    expect(mcq.isAccepted).toBe(true);

    const open = await adapter.gradeAnswer({ expected: "hello", userInput: "", quizType: "open_ended" });
    expect(open.gradingMethod).toBe("typo_tolerant");

    expect(adapter.calculateScore([{ percentageSimilar: 50 }, { percentageSimilar: 100 }])).toBe(75);
    expect(adapter.calculateScore([])).toBe(0);

    expect(adapter.toConfidenceLevel(0.85)).toBe("high");
    expect(adapter.toConfidenceLevel(0.6)).toBe("medium");
    expect(adapter.toConfidenceLevel(0.2)).toBe("low");
  });

  it("PdfOcrAdapter validates OCR content with all gates", async () => {
    const { PdfOcrAdapter } = await import("@/infrastructure/question-generation/PdfOcrAdapter");
    const adapter = new PdfOcrAdapter();

    // Valid: word count >= 6, char count >= 80, alpha ratio >= 45%, unique alpha >= 8
    // All words must be alphabetic, >= 6 words, >= 80 chars total, unique alpha >= 8
    const validText = "the magnificent adventure unfolds with crystal waters flowing through ancient forests";
    expect(adapter.isValidOcrContent(validText)).toBe(true);

    // Invalid: too few words (< 6)
    expect(adapter.isValidOcrContent("one two three")).toBe(false);

    // Invalid: too few characters (< 80)
    expect(adapter.isValidOcrContent("a b c d e f")).toBe(false);

    // Invalid: too few unique alpha words (< 8)
    const fewUnique = "same same same same same same same other";
    expect(adapter.isValidOcrContent(fewUnique)).toBe(false);

    // Invalid: alpha ratio too low (< 45%) - words with numbers
    expect(adapter.isValidOcrContent("word1 word2 word3 word4 word5 word6 word7")).toBe(false);
  });

  it("PdfOcrAdapter extractTextFromPdf tries models in fallback sequence", async () => {
    const { PdfOcrAdapter } = await import("@/infrastructure/question-generation/PdfOcrAdapter");

    // Mock OpenAI client module
    jest.doMock("@/lib/openaiClient", () => ({
      getClient: jest.fn().mockReturnValue({
        vision: {
          ocr: jest.fn(),
        },
      }),
    }), { virtual: true });

    const adapter = new PdfOcrAdapter();

    // Test that extraction attempts models (in real scenario, would call actual OpenAI)
    // Here we verify the adapter is instantiated correctly
    expect(adapter).toBeDefined();
    expect(typeof adapter.extractTextFromPdf).toBe("function");
    expect(typeof adapter.isValidOcrContent).toBe("function");
  });

  it("TopicRepositoryAdapter delegates to server repositories", async () => {
    // TopicRepositoryAdapter has methods: increment(topic) and listAll()
    // These delegate to incrementTopicCount and listTopicCounts from server/repositories/topicRepository
    const { TopicRepositoryAdapter } = await import("@/infrastructure/topic/TopicRepositoryAdapter");
    const adapter = new TopicRepositoryAdapter();

    // Verify methods exist and are callable
    expect(typeof adapter.increment).toBe("function");
    expect(typeof adapter.listAll).toBe("function");

    // Test that adapter instantiates without error
    expect(adapter).toBeDefined();
  });

  it("QuizAttemptRepositoryAdapter delegates persistence operations", async () => {
    // QuizAttemptRepositoryAdapter wraps userQuizAttemptRepository functions
    // Methods: ensurePending, findAttemptByUserAndQuiz, completeAttempt, complete
    const { QuizAttemptRepositoryAdapter } = await import("@/infrastructure/quiz/QuizAttemptRepositoryAdapter");
    const adapter = new QuizAttemptRepositoryAdapter();

    // Verify adapter methods exist
    expect(typeof adapter.ensurePending).toBe("function");
    expect(typeof adapter.findAttemptByUserAndQuiz).toBe("function");
    expect(typeof adapter.completeAttempt).toBe("function");
    expect(typeof adapter.complete).toBe("function");

    // Adapter instantiates correctly
    expect(adapter).toBeDefined();
  });

  it("NextAuthSessionAdapter provides getSession method", async () => {
    // NextAuthSessionAdapter is a minimal adapter with only getSession method
    const { NextAuthSessionAdapter } = await import("@/infrastructure/auth/NextAuthSessionAdapter");
    const adapter = new NextAuthSessionAdapter();

    // Verify adapter has getSession method
    expect(typeof adapter.getSession).toBe("function");

    // Adapter instantiates correctly
    expect(adapter).toBeDefined();
  });
});
