import { POST, GET, DELETE } from "@/app/api/quiz-review/route";
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

describe("/api/quiz-review Route Handler", () => {
  let adminUser: any;
  let normalUser: any;
  let quizId: string;

  beforeAll(async () => {
    // Use unique emails for this test file and clean up before creating
    await prisma.user.deleteMany({
      where: { email: { in: ["admin-quizreview@example.com", "user-quizreview@example.com"] } },
    });
    adminUser = await prisma.user.create({
      data: { email: "admin-quizreview@example.com", isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: "user-quizreview@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    await prisma.adminQuiz.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ["admin-quizreview@example.com", "user-quizreview@example.com"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // POST tests
  it("returns 401 if not admin (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: normalUser });
    const req = new Request("http://localhost/api/quiz-review", {
      method: "POST",
      body: JSON.stringify({ title: "Quiz", questions: [], category: "cat", difficulty: "easy" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("creates a quiz with title from fileName (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    const req = new Request("http://localhost/api/quiz-review", {
      method: "POST",
      body: JSON.stringify({
        fileName: "myquiz.json",
        category: "cat",
        difficulty: "easy",
        questions: [{ question: "Q1", answer: "A1" }],
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.quiz.title).toBe("myquiz");
    expect(json.quiz.questions.length).toBe(1);
    quizId = json.quiz.id;
  });

  it("creates a quiz with fallback title (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    const req = new Request("http://localhost/api/quiz-review", {
      method: "POST",
      body: JSON.stringify({
        category: "cat",
        difficulty: "easy",
        questions: [{ question: "Q2", answer: "A2" }],
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.quiz.title).toBe("Untitled Quiz");
  });

  it("returns 500 on DB error (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    const spy = jest.spyOn(prisma.adminQuiz, "create").mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost/api/quiz-review", {
      method: "POST",
      body: JSON.stringify({
        title: "Quiz",
        category: "cat",
        difficulty: "easy",
        questions: [{ question: "Q", answer: "A" }],
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(500);
    spy.mockRestore();
  });

  // GET tests
  it("returns 401 if not authenticated (GET)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/quiz-review", { method: "GET" });
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("returns quizzes with filters (GET)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    const req = new Request("http://localhost/api/quiz-review?category=cat&difficulty=easy", { method: "GET" });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.quizzes)).toBe(true);
  });

  // DELETE tests
  it("returns 401 if not authenticated (DELETE)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const req = new Request("http://localhost/api/quiz-review?id=" + quizId, { method: "DELETE" });
    const res = await DELETE(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 400 if id missing (DELETE)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    const req = new Request("http://localhost/api/quiz-review", { method: "DELETE" });
    const res = await DELETE(req as any);
    expect(res.status).toBe(400);
  });

  it("deletes a quiz (DELETE)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    // Create a quiz to delete
    const quiz = await prisma.adminQuiz.create({
      data: {
        title: "ToDelete",
        category: "cat",
        difficulty: "easy",
        status: "approved",
        questions: { create: [{ question: "Q", answer: "A" }] },
      },
    });
    const req = new Request("http://localhost/api/quiz-review?id=" + quiz.id, { method: "DELETE" });
    const res = await DELETE(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 500 on DB error (DELETE)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    jest.spyOn(prisma.adminQuiz, "delete").mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost/api/quiz-review?id=badid", { method: "DELETE" });
    const res = await DELETE(req as any);
    expect(res.status).toBe(500);
  });
});