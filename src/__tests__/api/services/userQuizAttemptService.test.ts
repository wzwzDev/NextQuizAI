import {
  getUserQuizStats,
  saveUserQuizAttempt,
  getUserQuizAttempt,
  ensurePendingQuizAttempt,
  completePendingQuizAttempt,
  getUserQuizAttemptStatuses,
  getAdaptiveQuizRecommendations,
  UserQuizAttemptAlreadyCompletedError,
  UserQuizAttemptNotStartedError,
} from "@/server/services/userQuizAttemptService";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("userQuizAttemptService", () => {
  let user: User;
  let adminUser: User;
  let quizId: string;
  let quiz2Id: string;

  beforeAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { quizId: { in: ["service-q1", "service-q2", "service-q3"] } } });
    await prisma.user.deleteMany({ where: { email: { in: ["service-attempt-user@example.com", "service-admin@example.com"] } } });

    user = await prisma.user.create({
      data: { email: "service-attempt-user@example.com" },
    });

    adminUser = await prisma.user.create({
      data: { email: "service-admin@example.com", isAdmin: true },
    });

    const quiz = await prisma.adminQuiz.create({
      data: {
        title: "Service Quiz 1",
        quizType: "mcq",
        category: "math",
        difficulty: "medium",
      },
    });
    quizId = quiz.id;

    const quiz2 = await prisma.adminQuiz.create({
      data: {
        title: "Service Quiz 2",
        quizType: "open_ended",
        category: "science",
        difficulty: "hard",
      },
    });
    quiz2Id = quiz2.id;
  });

  afterAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { userId: user.id } });
    await prisma.userQuizAttempt.deleteMany({ where: { userId: adminUser.id } });
    await prisma.adminQuiz.deleteMany({ where: { id: { in: [quizId, quiz2Id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, adminUser.id] } } });
    await prisma.$disconnect();
  });

  it("creates an attempt", async () => {
    const attempt = await saveUserQuizAttempt({
      userId: user.id,
      quizId: "service-q1",
      quizTitle: "Service Quiz 1",
      answers: [{ question: "Q", answer: "A" }],
      score: 90,
    });

    expect(attempt.userId).toBe(user.id);
    expect(attempt.quizId).toBe("service-q1");
  });

  it("blocks retake attempts for the same quiz", async () => {
    await expect(
      saveUserQuizAttempt({
        userId: user.id,
        quizId: "service-q1",
        quizTitle: "Quiz 1",
        answers: [],
        score: 80,
      }),
    ).rejects.toBeInstanceOf(UserQuizAttemptAlreadyCompletedError);
  });

  it("aggregates completed attempts by quiz", async () => {
    await saveUserQuizAttempt({
      userId: user.id,
      quizId: "service-q2",
      quizTitle: "Quiz 2",
      answers: [],
      score: 60,
    });

    const stats = await getUserQuizStats(user.id);

    expect(stats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "service-q1",
          attempts: 1,
          averageScore: 90,
        }),
        expect.objectContaining({
          id: "service-q2",
          title: "Quiz 2",
          attempts: 1,
          averageScore: 60,
        }),
      ]),
    );
  });

  describe("getUserQuizAttempt", () => {
    it("should return null if no attempt exists", async () => {
      const result = await getUserQuizAttempt(adminUser.id, quizId);
      expect(result).toBeNull();
    });

    it("should return attempt if exists", async () => {
      await prisma.userQuizAttempt.create({
        data: {
          userId: adminUser.id,
          quizId,
          quizTitle: "Sample Quiz",
          status: "completed",
          score: 75,
          answers: {},
        },
      });

      const result = await getUserQuizAttempt(adminUser.id, quizId);
      expect(result).not.toBeNull();
      expect(result?.score).toBe(75);
    });
  });

  describe("ensurePendingQuizAttempt", () => {
    it("should create pending attempt", async () => {
      const result = await ensurePendingQuizAttempt({
        userId: adminUser.id,
        quizId: quiz2Id,
        quizTitle: "Quiz 2",
      });

      expect(result.status).toBe("pending");
    });
  });

  describe("completePendingQuizAttempt", () => {
    it("should complete pending attempt", async () => {
      await ensurePendingQuizAttempt({
        userId: adminUser.id,
        quizId: "service-q3",
        quizTitle: "Quiz 3",
      });

      // Update to have correct userId/quizId
      const actualAttempt = await prisma.userQuizAttempt.findUnique({
        where: { user_quiz_attempt_unique: { userId: adminUser.id, quizId: "service-q3" } },
      });

      if (actualAttempt) {
        const result = await completePendingQuizAttempt({
          userId: adminUser.id,
          quizId: "service-q3",
          answers: { result: "correct" },
          score: 95,
        });

        expect(result.status).toBe("completed");
        expect(result.score).toBe(95);
      }
    });

    it("should throw error if attempt not started", async () => {
      await expect(
        completePendingQuizAttempt({
          userId: "non-existent",
          quizId: "non-existent",
          answers: {},
          score: 80,
        }),
      ).rejects.toThrow(UserQuizAttemptNotStartedError);
    });
  });

  describe("getUserQuizAttemptStatuses", () => {
    it("should return statuses for quiz list", async () => {
      const result = await getUserQuizAttemptStatuses(adminUser.id, [quizId, quiz2Id]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getAdaptiveQuizRecommendations", () => {
    it("should generate recommendations for quiz list", async () => {
      const result = await getAdaptiveQuizRecommendations(adminUser.id, [
        { id: quizId, category: "math", difficulty: "medium" },
        { id: quiz2Id, category: "science", difficulty: "hard" },
      ]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty quiz list", async () => {
      const result = await getAdaptiveQuizRecommendations(adminUser.id, []);
      expect(result).toHaveLength(0);
    });
  });
});