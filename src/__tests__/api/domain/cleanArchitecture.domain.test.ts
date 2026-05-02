import { NormalizedText } from "@/domain/value-objects/NormalizedText";
import { OpenEndedAnswer } from "@/domain/entities/OpenEndedAnswer";
import { gradeOpenEndedAnswer } from "@/domain/services/OpenEndedGrader";
import { Game } from "@/domain/entities/Game";
import { Question } from "@/domain/entities/Question";
import { Quiz } from "@/domain/entities/Quiz";
import { User } from "@/domain/entities/User";
import { UserQuizAttempt } from "@/domain/entities/UserQuizAttempt";
import { TopicCount } from "@/domain/entities/TopicCount";
import { Session } from "@/domain/entities/Session";
import { Account } from "@/domain/entities/Account";
import { AdminQuiz } from "@/domain/entities/AdminQuiz";
import { AdminQuizQuestion } from "@/domain/entities/AdminQuizQuestion";
import { EmailVerificationToken } from "@/domain/entities/EmailVerificationToken";
import { QuizQuestion } from "@/domain/entities/QuizQuestion";

describe("domain logic coverage", () => {
  it("NormalizedText supports normalization, sequence and adjacent swap", () => {
    const normalized = NormalizedText.from("  Hello   WORLD ");
    expect(normalized.value).toBe("hello world");
    expect(normalized.isEmpty).toBe(false);
    expect(normalized.tokens).toEqual(["hello", "world"]);

    const seqSource = NormalizedText.from("a b c d");
    const seqTarget = NormalizedText.from("b c");
    expect(seqSource.containsSequence(seqTarget)).toBe(true);
    expect(NormalizedText.from("a b").containsSequence(NormalizedText.from("b c"))).toBe(false);

    expect(NormalizedText.from("abcd").hasSingleAdjacentSwap(NormalizedText.from("abdc"))).toBe(true);
    expect(NormalizedText.from("abcd").hasSingleAdjacentSwap(NormalizedText.from("adbc"))).toBe(false);
  });

  it("OpenEndedAnswer grades execution-output and typo scenarios", () => {
    const similarityPort = { compare: jest.fn().mockReturnValue(0.85) };

    const exactExec = OpenEndedAnswer.fromRaw("1\n2", "1\n2").grade(similarityPort);
    expect(exactExec.isAccepted).toBe(true);
    expect(exactExec.gradingMethod).toBe("exact_match");

    const emptyUserExec = OpenEndedAnswer.fromRaw("1\n2", "").grade(similarityPort);
    expect(emptyUserExec.isAccepted).toBe(false);

    const containsExec = OpenEndedAnswer.fromRaw("2\n3", "1\n2\n3").grade(similarityPort);
    expect(containsExec.isAccepted).toBe(true);

    const adjacentSwap = OpenEndedAnswer.fromRaw("abcd", "abdc").grade(similarityPort);
    expect(adjacentSwap.isAccepted).toBe(true);

    const fuzzy = OpenEndedAnswer.fromRaw("expected", "different").grade({ compare: jest.fn().mockReturnValue(0.4) });
    expect(fuzzy.isAccepted).toBe(false);
  });

  it("gradeOpenEndedAnswer delegates and returns result", () => {
    const result = gradeOpenEndedAnswer("yes", "yes", { compare: jest.fn().mockReturnValue(1) });
    expect(result.isAccepted).toBe(true);
    expect(result.percentageSimilar).toBe(100);
  });

  it("entity fromPrisma methods map values and return null for empty input", () => {
    expect(Game.fromPrisma(null)).toBeNull();
    expect(Question.fromPrisma(null)).toBeNull();
    expect(Quiz.fromPrisma(null)).toBeNull();
    expect(User.fromPrisma(null)).toBeNull();
    expect(UserQuizAttempt.fromPrisma(null)).toBeNull();
    expect(TopicCount.fromPrisma(null)).toBeNull();
    expect(Session.fromPrisma(null)).toBeNull();
    expect(Account.fromPrisma(null)).toBeNull();
    expect(AdminQuiz.fromPrisma(null)).toBeNull();
    expect(AdminQuizQuestion.fromPrisma(null)).toBeNull();
    expect(EmailVerificationToken.fromPrisma(null)).toBeNull();
    expect(QuizQuestion.fromPrisma(null)).toBeNull();

    const q = Question.fromPrisma({
      id: "q1",
      question: "Q",
      answer: "A",
      gameId: "g1",
      questionType: "mcq",
    });
    expect(q?.id).toBe("q1");

    const g = Game.fromPrisma({
      id: "g1",
      userId: "u1",
      timeStarted: new Date().toISOString(),
      topic: "math",
      gameType: "mcq",
      questions: [{ id: "q1", question: "Q", answer: "A", gameId: "g1", questionType: "mcq" }],
    });
    expect(g?.questions.length).toBe(1);

    const quiz = Quiz.fromPrisma({
      id: 1,
      title: "t",
      category: "c",
      difficulty: "d",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [{ id: 1, question: "Q", answer: "A", options: "[]", quizId: 1 }],
    });
    expect(quiz?.id).toBe(1);

    const user = User.fromPrisma({ id: "u", email: "u@x.com", banned: false, revoked: false, isOnline: false, isAdmin: false });
    expect(user?.email).toBe("u@x.com");

    const attempt = UserQuizAttempt.fromPrisma({
      id: "a",
      userId: "u",
      quizId: "q",
      quizTitle: "qt",
      status: "pending",
      score: 0,
      answers: {},
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(attempt?.status).toBe("pending");
  });

  it("Account entity fromPrisma maps provider accounts with edge cases", () => {
    const accountData = {
      userId: "u1",
      type: "oauth",
      provider: "github",
      providerAccountId: "gh123",
      access_token: "tok1",
      token_type: "Bearer",
      scope: "user:email",
      expires_at: 1234567890,
      refresh_token: "refresh1",
      id_token: null,
    };

    const account = Account.fromPrisma(accountData);
    expect(account?.provider).toBe("github");
    expect(account?.providerAccountId).toBe("gh123");
    expect(account?.access_token).toBe("tok1");
    expect(account?.expires_at).toBe(1234567890);

    // Test with null and undefined fields
    const minimalAccount = Account.fromPrisma({
      userId: "u2",
      type: "oauth",
      provider: "google",
      providerAccountId: "g456",
    } as any);
    expect(minimalAccount?.provider).toBe("google");
  });

  it("Session entity fromPrisma handles session token and user mapping", () => {
    const sessionData = {
      id: "sid1",
      sessionToken: "token123",
      userId: "u1",
      expires: new Date("2025-12-31"),
    };

    const session = Session.fromPrisma(sessionData);
    expect(session?.sessionToken).toBe("token123");
    expect(session?.userId).toBe("u1");
    expect(session?.expires).toBeInstanceOf(Date);

    // Test with future expiry
    const futureDate = new Date(Date.now() + 86400000);
    const futureSession = Session.fromPrisma({
      id: "sid2",
      sessionToken: "token456",
      userId: "u2",
      expires: futureDate,
    });
    expect(futureSession?.sessionToken).toBe("token456");
    expect(futureSession?.expires).toBeInstanceOf(Date);
  });

  it("EmailVerificationToken entity fromPrisma validates token and email", () => {
    const expiresAt = new Date("2025-12-31");
    const tokenData = {
      id: "t1",
      tokenHash: "hash123",
      email: "test@example.com",
      expiresAt,
      consumedAt: null,
      createdAt: new Date(),
    };

    const emailToken = EmailVerificationToken.fromPrisma(tokenData);
    expect(emailToken?.email).toBe("test@example.com");
    expect(emailToken?.tokenHash).toBe("hash123");
    expect(emailToken?.expiresAt).toBeInstanceOf(Date);
    expect(emailToken?.consumedAt).toBeNull();

    // Test with consumed token
    const consumedToken = EmailVerificationToken.fromPrisma({
      id: "t2",
      tokenHash: "hash456",
      email: "consumed@example.com",
      expiresAt: new Date(),
      consumedAt: new Date(),
      createdAt: new Date(),
    });
    expect(consumedToken?.email).toBe("consumed@example.com");
    expect(consumedToken?.consumedAt).not.toBeNull();
  });

  it("TopicCount entity fromPrisma increments counts", () => {
    const topicData = {
      id: "t1",
      topic: "math",
      count: 5,
    };

    const topicCount = TopicCount.fromPrisma(topicData);
    expect(topicCount?.id).toBe("t1");
    expect(topicCount?.topic).toBe("math");
    expect(topicCount?.count).toBe(5);

    // Test with zero count
    const zeroCount = TopicCount.fromPrisma({
      id: "t2",
      topic: "science",
      count: 0,
    });
    expect(zeroCount?.count).toBe(0);

    // Test with high count
    const highCount = TopicCount.fromPrisma({
      id: "t3",
      topic: "history",
      count: 999,
    });
    expect(highCount?.count).toBe(999);
  });

  it("AdminQuiz entity fromPrisma maps quiz data with nested questions", () => {
    const adminQuizData = {
      id: "aq1",
      title: "Advanced Math",
      category: "Mathematics",
      difficulty: "hard",
      approved: true,
      questions: [
        { id: "q1", question: "Q1", answer: "A1", options: '["A1", "B1"]', type: "mcq" },
        { id: "q2", question: "Q2", answer: "A2", type: "open_ended" },
      ],
    };

    const adminQuiz = AdminQuiz.fromPrisma(adminQuizData as any);
    expect(adminQuiz?.id).toBe("aq1");
    expect(adminQuiz?.title).toBe("Advanced Math");
    expect(adminQuiz?.questions.length).toBe(2);
  });
});
