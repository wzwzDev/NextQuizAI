import { GET } from "@/app/api/(admin)/quiz-statistics/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

type QuizStatisticsEntry = {
  quizId: string;
  quizTitle: string;
  attempts: number;
  averageScore: number;
  completionRate: number;
};

jest.setTimeout(30000);

describe("/api/quiz-statistics Route Handler", () => {
  let adminUser: User;
  let normalUser: User;
  // Use a unique suffix for this test run
  const unique = Date.now();
  const adminEmail = `admin-quizstats-${unique}@example.com`;
  const userEmail = `user-quizstats-${unique}@example.com`;
  const quizId1 = `q1-${unique}`;
  const quizId2 = `q2-${unique}`;
  const quizTitle1 = `Quiz 1 ${unique}`;
  const quizTitle2 = `Quiz 2 ${unique}`;

  beforeAll(async () => {
    // Clean up quiz attempts first, then users, in a transaction
    await prisma.$transaction([
      prisma.userQuizAttempt.deleteMany({
        where: {
          OR: [
            { quizId: quizId1 },
            { quizId: quizId2 },
          ],
        },
      }),
      prisma.user.deleteMany({
        where: { email: { in: [adminEmail, userEmail] } },
      }),
    ]);
    adminUser = await prisma.user.create({
      data: { email: adminEmail, isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: userEmail, isAdmin: false },
    });
  });

  afterAll(async () => {
    await prisma.$transaction([
      prisma.userQuizAttempt.deleteMany({
        where: {
          OR: [
            { quizId: quizId1 },
            { quizId: quizId2 },
          ],
        },
      }),
      prisma.user.deleteMany({
        where: { email: { in: [adminEmail, userEmail] } },
      }),
    ]);
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if not admin", async () => {
    const req = new Request("http://localhost/api/quiz-statistics", {
      method: "GET",
      headers: { "x-test-user-email": normalUser.email },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("returns aggregated statistics for admin", async () => {
    // Seed some quiz attempts (answers must be valid JSON, e.g. [])
    await prisma.userQuizAttempt.createMany({
      data: [
        {
          quizId: quizId1,
          quizTitle: quizTitle1,
          score: 80,
          userId: adminUser.id,
          answers: [],
          status: "completed",
          completedAt: new Date(),
        },
        {
          quizId: quizId1,
          quizTitle: quizTitle1,
          score: 90,
          userId: normalUser.id,
          answers: [],
          status: "completed",
          completedAt: new Date(),
        },
        {
          quizId: quizId2,
          quizTitle: quizTitle2,
          score: 70,
          userId: adminUser.id,
          answers: [],
          status: "completed",
          completedAt: new Date(),
        },
      ],
    });

    const req = new Request("http://localhost/api/quiz-statistics", {
      method: "GET",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const stats = (await res.json()) as QuizStatisticsEntry[];

    expect(Array.isArray(stats)).toBe(true);

    // Check Quiz 1 stats
    const quiz1 = stats.find((s) => s.quizTitle === quizTitle1);
    expect(quiz1).toBeDefined();
    if (!quiz1) {
      throw new Error("Expected quiz statistics for quizTitle1");
    }
    expect(quiz1.attempts).toBe(2);
    expect(quiz1.averageScore).toBe(85);

    // Check Quiz 2 stats
    const quiz2 = stats.find((s) => s.quizTitle === quizTitle2);
    expect(quiz2).toBeDefined();
    if (!quiz2) {
      throw new Error("Expected quiz statistics for quizTitle2");
    }
    expect(quiz2.attempts).toBe(1);
    expect(quiz2.averageScore).toBe(70);

    // Check completionRate field exists
    expect(quiz1.completionRate).toBe(100);
    expect(quiz2.completionRate).toBe(100);
  });
});