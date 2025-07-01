import { POST, GET } from "@/app/api/user-quiz-stats/route";
import { prisma } from "@/lib/db";

// Mock getServerSession and authOptions
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from "next-auth";
jest.mock("@/lib/nextauth", () => ({
  authOptions: {},
}));
import { authOptions } from "@/lib/nextauth";

describe("/api/user-quiz-stats Route Handler", () => {
  let user: any;

 beforeAll(async () => {
  // Clean up quiz attempts first, then users, in a transaction
  await prisma.$transaction([
    prisma.userQuizAttempt.deleteMany({}),
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
    prisma.userQuizAttempt.deleteMany({}),
    prisma.user.deleteMany({
      where: { email: "user-quizstats@example.com" },
    }),
  ]);
  await prisma.$disconnect();
});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST creates a quiz attempt", async () => {
    const req = new Request("http://localhost/api/user-quiz-stats", {
      method: "POST",
      body: JSON.stringify({
        userId: user.id,
        quizId: "quiz1",
        quizTitle: "Quiz 1",
        answers: [],
        score: 80,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.attempt).toBeDefined();
    expect(json.attempt.quizId).toBe("quiz1");
    expect(json.attempt.score).toBe(80);
  });

  it("GET returns empty stats if not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/user-quiz-stats", { method: "GET" });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.quizStats)).toBe(true);
    expect(json.quizStats.length).toBe(0);
  });

  it("GET returns aggregated stats for user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user });
    // Add more attempts for aggregation
    await prisma.userQuizAttempt.createMany({
      data: [
        { userId: user.id, quizId: "quiz1", quizTitle: "Quiz 1", answers: [], score: 90 },
        { userId: user.id, quizId: "quiz2", quizTitle: "Quiz 2", answers: [], score: 70 },
      ],
    });
    const req = new Request("http://localhost/api/user-quiz-stats", { method: "GET" });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.quizStats)).toBe(true);

    const quiz1 = json.quizStats.find((q: any) => q.id === "quiz1");
    expect(quiz1).toBeDefined();
    expect(quiz1.attempts).toBeGreaterThanOrEqual(2);
    expect(quiz1.averageScore).toBeGreaterThan(0);

    const quiz2 = json.quizStats.find((q: any) => q.id === "quiz2");
    expect(quiz2).toBeDefined();
    expect(quiz2.attempts).toBe(1);
    expect(quiz2.averageScore).toBe(70);
  });
});