import { GET } from "@/app/api/quiz-statistics/route";
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

describe("/api/quiz-statistics Route Handler", () => {
  let adminUser: any;
  let normalUser: any;
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
    (getServerSession as jest.Mock).mockResolvedValue({ user: normalUser });
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("returns aggregated statistics for admin", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });

    // Seed some quiz attempts (answers must be valid JSON, e.g. [])
    await prisma.userQuizAttempt.createMany({
      data: [
        { quizId: quizId1, quizTitle: quizTitle1, score: 80, userId: adminUser.id, answers: [] },
        { quizId: quizId1, quizTitle: quizTitle1, score: 90, userId: normalUser.id, answers: [] },
        { quizId: quizId2, quizTitle: quizTitle2, score: 70, userId: adminUser.id, answers: [] },
      ],
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const stats = await res.json();

    expect(Array.isArray(stats)).toBe(true);

    // Check Quiz 1 stats
    const quiz1 = stats.find((s: any) => s.quizTitle === quizTitle1);
    expect(quiz1).toBeDefined();
    expect(quiz1.attempts).toBe(2);
    expect(quiz1.averageScore).toBe(85);

    // Check Quiz 2 stats
    const quiz2 = stats.find((s: any) => s.quizTitle === quizTitle2);
    expect(quiz2).toBeDefined();
    expect(quiz2.attempts).toBe(1);
    expect(quiz2.averageScore).toBe(70);

    // Check completionRate field exists
    expect(quiz1.completionRate).toBe(100);
    expect(quiz2.completionRate).toBe(100);
  });
});