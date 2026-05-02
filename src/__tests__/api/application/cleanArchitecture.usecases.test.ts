import { RegisterUserWithPasswordUseCase, RegistrationConflictError } from "@/application/use-cases/auth/RegisterUserWithPasswordUseCase";
import { CheckAnswerUseCase, QuestionAccessForbiddenError, QuestionNotFoundError } from "@/application/use-cases/game/CheckAnswerUseCase";
import { EndGameUseCase, GameAccessForbiddenError, GameNotFoundError } from "@/application/use-cases/game/EndGameUseCase";
import { StartQuizAttemptUseCase, QuizAlreadyCompletedError, QuizAttemptStartError } from "@/application/use-cases/quiz/StartQuizAttemptUseCase";
import { SubmitQuizAttemptUseCase, QuizAttemptNotStartedError } from "@/application/use-cases/quiz/SubmitQuizAttemptUseCase";
import { CreateAdminQuizUseCase } from "@/application/use-cases/admin/CreateAdminQuizUseCase";
import { GenerateQuestionsFromPdfUseCase } from "@/application/use-cases/question-generation/GenerateQuestionsFromPdfUseCase";
import { GetAdminQuizzesUseCase } from "@/application/use-cases/admin/GetAdminQuizzesUseCase";

describe("application use-cases", () => {
  it("register use case throws on duplicate email", async () => {
    const uc = new RegisterUserWithPasswordUseCase(
      {
        findUserByEmail: jest.fn().mockResolvedValue({ id: "u1" }),
        createUserWithPassword: jest.fn(),
      },
      { hash: jest.fn() },
      { createToken: jest.fn() },
      { buildVerificationUrl: jest.fn() },
      { sendVerification: jest.fn() },
    );

    await expect(
      uc.execute({ email: "Test@Mail.com", password: "x" }),
    ).rejects.toBeInstanceOf(RegistrationConflictError);
  });

  it("register use case normalizes email and sends verification", async () => {
    const authRepo = {
      findUserByEmail: jest.fn().mockResolvedValue(null),
      createUserWithPassword: jest.fn().mockResolvedValue(undefined),
    };
    const hasher = { hash: jest.fn().mockResolvedValue("hash") };
    const tokenPort = { createToken: jest.fn().mockResolvedValue({ token: "tok" }) };
    const urlBuilder = { buildVerificationUrl: jest.fn().mockReturnValue("http://verify") };
    const emailSender = { sendVerification: jest.fn().mockResolvedValue(undefined) };

    const uc = new RegisterUserWithPasswordUseCase(
      authRepo,
      hasher,
      tokenPort,
      urlBuilder,
      emailSender,
    );

    await uc.execute({ email: "  TeSt@Mail.COM  ", name: "  Alice  ", password: "abc" });

    expect(authRepo.findUserByEmail).toHaveBeenCalledWith("test@mail.com");
    expect(authRepo.createUserWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@mail.com", name: "Alice", passwordHash: "hash" }),
    );
    expect(emailSender.sendVerification).toHaveBeenCalledWith(
      expect.objectContaining({ to: "test@mail.com", verificationUrl: "http://verify" }),
    );
  });

  it("check answer throws not found", async () => {
    const uc = new CheckAnswerUseCase(
      {
        findById: jest.fn().mockResolvedValue(null),
        saveUserAnswer: jest.fn(),
        saveMcqResult: jest.fn(),
        saveOpenEndedResult: jest.fn(),
      },
      { canUserAccessResource: jest.fn().mockReturnValue(true) },
      { execute: jest.fn() } as any,
    );

    await expect(uc.execute({ questionId: "q1", userAnswer: "a" })).rejects.toBeInstanceOf(
      QuestionNotFoundError,
    );
  });

  it("check answer throws forbidden", async () => {
    const uc = new CheckAnswerUseCase(
      {
        findById: jest.fn().mockResolvedValue({
          questionType: "mcq",
          answer: "A",
          game: { userId: "owner" },
        }),
        saveUserAnswer: jest.fn(),
        saveMcqResult: jest.fn(),
        saveOpenEndedResult: jest.fn(),
      },
      { canUserAccessResource: jest.fn().mockReturnValue(false) },
      { execute: jest.fn() } as any,
    );

    await expect(
      uc.execute({ questionId: "q1", userAnswer: "a", userId: "u2", isAdmin: false }),
    ).rejects.toBeInstanceOf(QuestionAccessForbiddenError);
  });

  it("check answer grades mcq and saves result", async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue({
        questionType: "mcq",
        answer: "Correct",
        game: { userId: "owner" },
      }),
      saveUserAnswer: jest.fn().mockResolvedValue(undefined),
      saveMcqResult: jest.fn().mockResolvedValue(undefined),
      saveOpenEndedResult: jest.fn().mockResolvedValue(undefined),
    };
    const uc = new CheckAnswerUseCase(
      repo,
      { canUserAccessResource: jest.fn().mockReturnValue(true) },
      { execute: jest.fn() } as any,
    );

    const result = await uc.execute({ questionId: "q1", userAnswer: "correct", userId: "owner" });
    expect(result).toEqual({ isCorrect: true });
    expect(repo.saveMcqResult).toHaveBeenCalledWith("q1", true);
  });

  it("check answer grades open-ended and saves percentage", async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue({
        questionType: "open_ended",
        answer: "expected",
        game: { userId: "owner" },
      }),
      saveUserAnswer: jest.fn().mockResolvedValue(undefined),
      saveMcqResult: jest.fn().mockResolvedValue(undefined),
      saveOpenEndedResult: jest.fn().mockResolvedValue(undefined),
    };

    const gradeUseCase = {
      execute: jest.fn().mockResolvedValue({ percentageSimilar: 100, gradingMethod: "exact_match" }),
    };

    const uc = new CheckAnswerUseCase(
      repo,
      { canUserAccessResource: jest.fn().mockReturnValue(true) },
      gradeUseCase as any,
    );

    const result = await uc.execute({ questionId: "q2", userAnswer: "expected" });
    expect(result).toEqual({ percentageSimilar: 100, gradingMethod: "exact_match" });
    expect(repo.saveOpenEndedResult).toHaveBeenCalledWith("q2", 100);
  });

  it("end game use case handles not found / forbidden / success", async () => {
    const notFound = new EndGameUseCase(
      { findGameById: jest.fn().mockResolvedValue(null), endGame: jest.fn() } as any,
      { canUserAccessResource: jest.fn() } as any,
    );
    await expect(notFound.execute({ gameId: "g1" })).rejects.toBeInstanceOf(GameNotFoundError);

    const forbidden = new EndGameUseCase(
      { findGameById: jest.fn().mockResolvedValue({ id: "g1", userId: "owner" }), endGame: jest.fn() } as any,
      { canUserAccessResource: jest.fn().mockReturnValue(false) } as any,
    );
    await expect(
      forbidden.execute({ gameId: "g1", userId: "u2", isAdmin: false }),
    ).rejects.toBeInstanceOf(GameAccessForbiddenError);

    const repo = {
      findGameById: jest.fn().mockResolvedValue({ id: "g2", userId: "owner" }),
      endGame: jest.fn().mockResolvedValue(undefined),
    };
    const success = new EndGameUseCase(repo as any, { canUserAccessResource: jest.fn().mockReturnValue(true) } as any);
    await success.execute({ gameId: "g2", userId: "owner" });
    expect(repo.endGame).toHaveBeenCalledWith("g2");
  });

  it("start/submit quiz attempt use-cases cover error and success branches", async () => {
    const startAlreadyCompleted = new StartQuizAttemptUseCase({
      findAttemptByUserAndQuiz: jest.fn().mockResolvedValue({ status: "completed" }),
      ensurePending: jest.fn(),
    } as any);
    await expect(
      startAlreadyCompleted.execute({ userId: "u", quizId: "q", quizTitle: "t" }),
    ).rejects.toBeInstanceOf(QuizAlreadyCompletedError);

    const startError = new StartQuizAttemptUseCase({
      findAttemptByUserAndQuiz: jest.fn().mockResolvedValue(null),
      ensurePending: jest.fn().mockResolvedValue(null),
    } as any);
    await expect(startError.execute({ userId: "u", quizId: "q", quizTitle: "t" })).rejects.toBeInstanceOf(
      QuizAttemptStartError,
    );

    const startOk = new StartQuizAttemptUseCase({
      findAttemptByUserAndQuiz: jest.fn().mockResolvedValue(null),
      ensurePending: jest.fn().mockResolvedValue({ id: "a1" }),
    } as any);
    await expect(startOk.execute({ userId: "u", quizId: "q", quizTitle: "t" })).resolves.toEqual({
      id: "a1",
      userId: "u",
      quizId: "q",
      status: "pending",
    });

    const submitNotStarted = new SubmitQuizAttemptUseCase({
      findAttemptByUserAndQuiz: jest.fn().mockResolvedValue(null),
      completeAttempt: jest.fn(),
    } as any);
    await expect(
      submitNotStarted.execute({ userId: "u", quizId: "q", answers: {}, score: 1 }),
    ).rejects.toBeInstanceOf(QuizAttemptNotStartedError);

    const submitCompleted = new SubmitQuizAttemptUseCase({
      findAttemptByUserAndQuiz: jest.fn().mockResolvedValue({ status: "completed" }),
      completeAttempt: jest.fn(),
    } as any);
    await expect(
      submitCompleted.execute({ userId: "u", quizId: "q", answers: {}, score: 1 }),
    ).rejects.toThrow(/already completed/i);

    const completeAttempt = jest.fn().mockResolvedValue(undefined);
    const submitOk = new SubmitQuizAttemptUseCase({
      findAttemptByUserAndQuiz: jest.fn().mockResolvedValue({ status: "pending" }),
      completeAttempt,
    } as any);
    await submitOk.execute({ userId: "u", quizId: "q", answers: { x: 1 }, score: 88 });
    expect(completeAttempt).toHaveBeenCalled();
  });

  it("create admin quiz normalizes title/options and validates fields", async () => {
    const createApprovedQuiz = jest.fn().mockResolvedValue({ id: "quiz" });
    const uc = new CreateAdminQuizUseCase({ createApprovedQuiz } as any);

    await expect(
      uc.execute({
        fileName: "my-quiz.pdf",
        category: "cat",
        difficulty: "easy",
        quizType: "open_ended",
        questions: [{ question: " ", answer: "a" }],
      }),
    ).rejects.toThrow(/must include both question and answer/i);

    await uc.execute({
      fileName: "my-quiz.pdf",
      category: "cat",
      difficulty: "easy",
      quizType: "mcq",
      questions: [
        { question: "Q1", answer: "A1", options: ["x, y", "z", "A1"] },
      ],
    });

    expect(createApprovedQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "my-quiz",
        quizType: "mcq",
        status: "approved",
      }),
    );
  });

  it("generate from pdf validates OCR and enforces count/slicing", async () => {
    const pdfOcrBad = {
      extractTextFromPdf: jest.fn().mockResolvedValue("bad"),
      isValidOcrContent: jest.fn().mockReturnValue(false),
    };
    const llm = { strictOutput: jest.fn() };
    const ucBad = new GenerateQuestionsFromPdfUseCase(pdfOcrBad as any, llm as any);

    await expect(
      ucBad.execute({ fileData: Buffer.from("x"), questionCount: 3, type: "open_ended" }),
    ).rejects.toThrow(/could not be extracted/i);

    const questions = [
      { question: "q1", answer: "a1" },
      { question: "q2", answer: "a2" },
      { question: "q3", answer: "a3" },
    ];

    const ucOk = new GenerateQuestionsFromPdfUseCase(
      {
        extractTextFromPdf: jest.fn().mockResolvedValue("content".repeat(1000)),
        isValidOcrContent: jest.fn().mockReturnValue(true),
      } as any,
      {
        strictOutput: jest.fn().mockResolvedValue({ questions }),
      } as any,
    );

    const result = await ucOk.execute({ fileData: Buffer.from("x"), questionCount: Number.NaN as any, type: "open_ended" });
    expect(result.length).toBe(3);
  });

  it("get admin quizzes use case computes attempt summaries", async () => {
    const createdAt = new Date("2024-01-01T00:00:00Z");
    const completedAt = new Date("2024-01-02T00:00:00Z");

    const uc = new GetAdminQuizzesUseCase(
      {
        findApprovedQuizzesWithAttempts: jest.fn().mockResolvedValue([
          { id: "q1", questions: [{}, {}] },
          { id: "q2", questions: [{}] },
        ]),
      } as any,
      {
        findUserAttemptsByQuizIds: jest.fn().mockResolvedValue([
          { quizId: "q1", status: "completed", score: 80, createdAt, completedAt },
          { quizId: "q1", status: "pending", score: null, createdAt: new Date("2024-01-03T00:00:00Z"), completedAt: null },
        ]),
      } as any,
    );

    const out = await uc.execute();
    expect(out[0].questionCount).toBe(2);
    expect(out[0].attemptSummary.totalAttempts).toBe(2);
    expect(out[0].attemptSummary.completedAttempts).toBe(1);
    expect(out[0].attemptSummary.averageScore).toBe(80);
    expect(out[1].attemptSummary.totalAttempts).toBe(0);
  });

  it("generate questions clamps out-of-range question count to bounds", async () => {
    const questions = Array.from({ length: 50 }, (_, i) => ({ question: `q${i}`, answer: `a${i}` }));
    const genUc = new GenerateQuestionsFromPdfUseCase(
      {
        extractTextFromPdf: jest.fn().mockResolvedValue("x".repeat(5000)),
        isValidOcrContent: jest.fn().mockReturnValue(true),
      } as any,
      {
        strictOutput: jest.fn().mockResolvedValue({ questions }),
      } as any,
    );

    // Test max clamping: request 500, should be clamped to 50
    const resultMax = await genUc.execute({ fileData: Buffer.from("x"), questionCount: 500, type: "mcq" });
    expect(resultMax.length).toBeLessThanOrEqual(50);

    // Test min clamping: request 0, should be clamped to 1
    const resultMin = await genUc.execute({ fileData: Buffer.from("x"), questionCount: 0, type: "open_ended" });
    expect(resultMin.length).toBeGreaterThanOrEqual(1);
  });

  it("generate questions truncates large content over 16000 chars", async () => {
    const questions = [{ question: "q1", answer: "a1" }];
    const largeContent = "x".repeat(20000);
    let capturedPrompt = "";

    const genUc = new GenerateQuestionsFromPdfUseCase(
      {
        extractTextFromPdf: jest.fn().mockResolvedValue(largeContent),
        isValidOcrContent: jest.fn().mockReturnValue(true),
      } as any,
      {
        strictOutput: jest.fn().mockImplementation(async (prompt) => {
          capturedPrompt = prompt;
          return { questions };
        }),
      } as any,
    );

    await genUc.execute({ fileData: Buffer.from("x"), questionCount: 1, type: "mcq" });
    expect(capturedPrompt.length).toBeLessThanOrEqual(16000);
  });

  it("VerifyEmailTokenUseCase returns error on invalid token", async () => {
    const { VerifyEmailTokenUseCase } = await import("@/application/use-cases/auth/VerifyEmailTokenUseCase");
    const tokenPort = {
      verifyToken: jest.fn().mockResolvedValue({ ok: false }),
    };
    const uc = new VerifyEmailTokenUseCase(tokenPort as any);
    const result = await uc.execute({ token: "bad" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("invalid or expired");
  });

  it("VerifyEmailTokenUseCase returns email on valid token", async () => {
    const { VerifyEmailTokenUseCase } = await import("@/application/use-cases/auth/VerifyEmailTokenUseCase");
    const tokenPort = {
      verifyToken: jest.fn().mockResolvedValue({ ok: true, email: "test@example.com" }),
    };
    const uc = new VerifyEmailTokenUseCase(tokenPort as any);
    const result = await uc.execute({ token: "good" });
    expect(result.ok).toBe(true);
    expect(result.email).toBe("test@example.com");
  });
});
