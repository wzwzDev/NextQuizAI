import { POST, GET } from "@/app/api/user-quiz-stats/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
jest.setTimeout(30000);

describe("/api/user-quiz-stats Route Handler", () => {
  let user: User;

 beforeAll(async () => {
  // Clean up scoped test data first, then create test user
  await prisma.$transaction([
    prisma.userQuizAttempt.deleteMany({
      where: { quizId: { in: ["quiz1", "quiz2"] } },
    }),
    prisma.user.deleteMany({
      where: { email: "user-quizstats@example.com" },
    }),
  ]);
  user = await prisma.user.create({
    data: { email: "user-quizstats@example.com" },
  });
});

afterAll(async () => {
  await prisma.$transaction([
    prisma.userQuizAttempt.deleteMany({
      where: { userId: user.id },
    }),
    prisma.user.deleteMany({
      where: { email: "user-quizstats@example.com" },
    }),
  ]);
  await prisma.$disconnect();
});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST returns 401 when unauthenticated", async () => {
    const req = new Request("http://localhost/api/user-quiz-stats", {
      method: "POST",
      body: JSON.stringify({
        quizId: "quiz1",
        quizTitle: "Quiz 1",
        answers: [],
        score: 80,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("POST creates a quiz attempt", async () => {
    const req = new Request("http://localhost/api/user-quiz-stats", {
      method: "POST",
      body: JSON.stringify({
        quizId: "quiz1",
        quizTitle: "Quiz 1",
        answers: [],
        score: 80,
      }),
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": user.email,
      },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.attempt).toBeDefined();
    expect(json.attempt.quizId).toBe("quiz1");
    expect(json.attempt.score).toBe(80);
  });

  it("POST returns 400 for invalid payload", async () => {
    const req = new Request("http://localhost/api/user-quiz-stats", {
      method: "POST",
      body: JSON.stringify({
        quizTitle: "Quiz 1",
        answers: [],
        score: 80,
      }),
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": user.email,
      },
    });

    const res = await POST(req as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(Array.isArray(json.error)).toBe(true);
  });

  it("POST returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/user-quiz-stats", {
      method: "POST",
      body: "not-json",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": user.email,
      },
    });

    const res = await POST(req as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid JSON");
  });

  it("GET returns empty stats if not authenticated", async () => {
    const req = new Request("http://localhost/api/user-quiz-stats", { method: "GET" });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.quizStats)).toBe(true);
    expect(json.quizStats.length).toBe(0);
  });

  it("GET returns aggregated stats for user", async () => {
    // Add additional completed quiz for aggregation
    await prisma.userQuizAttempt.createMany({
      data: [
        {
          userId: user.id,
          quizId: "quiz2",
          quizTitle: "Quiz 2",
          answers: [],
          score: 70,
          status: "completed",
          completedAt: new Date(),
        },
      ],
    });
    const req = new Request("http://localhost/api/user-quiz-stats", {
      method: "GET",
      headers: { "x-test-user-email": user.email },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.quizStats)).toBe(true);

    const quiz1 = json.quizStats.find((q: { id: string }) => q.id === "quiz1");
    expect(quiz1).toBeDefined();
    expect(quiz1.attempts).toBe(1);
    expect(quiz1.averageScore).toBe(80);

    const quiz2 = json.quizStats.find((q: { id: string }) => q.id === "quiz2");
    expect(quiz2).toBeDefined();
    expect(quiz2.attempts).toBe(1);
    expect(quiz2.averageScore).toBe(70);
  });
});