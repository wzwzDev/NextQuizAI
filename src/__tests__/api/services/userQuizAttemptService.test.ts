import {
  getUserQuizStats,
  saveUserQuizAttempt,
} from "@/server/services/userQuizAttemptService";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("userQuizAttemptService", () => {
  let user: User;

  beforeAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { quizId: { in: ["service-q1", "service-q2"] } } });
    await prisma.user.deleteMany({ where: { email: "service-attempt-user@example.com" } });

    user = await prisma.user.create({
      data: { email: "service-attempt-user@example.com" },
    });
  });

  afterAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
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

  it("aggregates attempts by quiz", async () => {
    await saveUserQuizAttempt({
      userId: user.id,
      quizId: "service-q1",
      quizTitle: "Quiz 1",
      answers: [],
      score: 80,
    });
    await saveUserQuizAttempt({
      userId: user.id,
      quizId: "service-q1",
      quizTitle: "Quiz 1",
      answers: [],
      score: 100,
    });
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
          attempts: 3,
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
});