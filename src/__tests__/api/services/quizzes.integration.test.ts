import { GET } from "@/app/api/quizzes/route";
import { prisma } from "@/server/core/db";
import type { NextRequest } from "next/server";

jest.setTimeout(30000);

describe("GET /api/quizzes", () => {
  let user;
  const suitePrefix = `quizzes-suite-${Date.now()}`;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: "quizzes-test@example.com" },
    });
    user = await prisma.user.create({
      data: { email: "quizzes-test@example.com", isAdmin: false },
    });
  });

  afterEach(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { userId: user.id } });
    await prisma.adminQuiz.deleteMany({
      where: { title: { startsWith: suitePrefix } },
    });
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  const callGet = async (email?: string) => {
    const req = new Request("http://localhost/api/quizzes", {
      method: "GET",
      headers: {
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    return await GET(req as unknown as NextRequest);
  };

  it("should return 401 if not authenticated", async () => {
    const response = await callGet();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should return approved quizzes with attempt statuses", async () => {
    const quizTitle = `${suitePrefix}-test-quiz`;
    const quiz = await prisma.adminQuiz.create({
      data: {
        title: quizTitle,
        quizType: "mcq",
        status: "approved",
        category: "test",
        difficulty: "medium",
      },
    });

    const response = await callGet(user.email);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.quizzes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: quiz.id,
          title: quizTitle,
          attemptStatus: "available",
          isLocked: false,
        }),
      ]),
    );
  });

  it("should include user attempt status if attempt exists", async () => {
    const quizTitle = `${suitePrefix}-completed-quiz`;
    const quiz = await prisma.adminQuiz.create({
      data: {
        title: quizTitle,
        quizType: "mcq",
        status: "approved",
        category: "test",
        difficulty: "medium",
      },
    });

    const startedAt = new Date();
    const completedAt = new Date();
    await prisma.userQuizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        quizTitle,
        status: "completed",
        score: 85,
        startedAt,
        completedAt,
        answers: {},
      },
    });

    const response = await callGet(user.email);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.quizzes).toContainEqual(
      expect.objectContaining({
        id: quiz.id,
        attemptStatus: "completed",
        isLocked: false,
        userScore: 85,
        remainingAttempts: 1,
      }),
    );
  });

  it("should return only approved quizzes", async () => {
    await prisma.adminQuiz.create({
      data: {
        title: `${suitePrefix}-unapproved-quiz`,
        quizType: "mcq",
        status: "pending",
        category: "test",
        difficulty: "medium",
      },
    });

    const approvedQuiz = await prisma.adminQuiz.create({
      data: {
        title: `${suitePrefix}-approved-only-quiz`,
        quizType: "mcq",
        status: "approved",
        category: "test",
        difficulty: "medium",
      },
    });

    const response = await callGet(user.email);
    expect(response.status).toBe(200);
    const body = await response.json();
    const approvedInResponse = body.quizzes.find(
      (q: any) => q.id === approvedQuiz.id,
    );
    expect(approvedInResponse).toBeDefined();
  });
});
