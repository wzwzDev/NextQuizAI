import { POST, GET, DELETE } from "@/app/api/(admin)/quiz-review/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";
jest.setTimeout(30000);

describe("/api/quiz-review Route Handler", () => {
  let adminUser: User;
  let normalUser: User;
  let quizId: string;
  const createdQuizIds = new Set<string>();

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
  },30000);

  afterAll(async () => {
    if (createdQuizIds.size > 0) {
      await prisma.adminQuiz.deleteMany({
        where: { id: { in: Array.from(createdQuizIds) } },
      });
    }
    await prisma.user.deleteMany({
      where: { email: { in: ["admin-quizreview@example.com", "user-quizreview@example.com"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST tests
  it("returns 401 if not admin (POST)", async () => {
    const req = new Request("http://localhost/api/quiz-review", {
      method: "POST",
      body: JSON.stringify({ title: "Quiz", questions: [], category: "cat", difficulty: "easy" }),
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": normalUser.email,
      },
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(401);
  });

  it("creates a quiz with title from fileName (POST)", async () => {
    const req = new Request("http://localhost/api/quiz-review", {
      method: "POST",
      body: JSON.stringify({
        fileName: "myquiz.json",
        category: "cat",
        difficulty: "easy",
        questions: [{ question: "Q1", answer: "A1" }],
      }),
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": adminUser.email,
      },
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.quiz.title).toBe("myquiz");
    expect(json.quiz.questions.length).toBe(1);
    quizId = json.quiz.id;
    createdQuizIds.add(json.quiz.id);
  });

  it("creates a quiz with fallback title (POST)", async () => {
    const req = new Request("http://localhost/api/quiz-review", {
      method: "POST",
      body: JSON.stringify({
        category: "cat",
        difficulty: "easy",
        questions: [{ question: "Q2", answer: "A2" }],
      }),
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": adminUser.email,
      },
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.quiz.title).toBe("Untitled Quiz");
    createdQuizIds.add(json.quiz.id);
  });

  it("returns 400 when question payload is invalid (POST)", async () => {
    const req = new Request("http://localhost/api/quiz-review", {
      method: "POST",
      body: JSON.stringify({
        title: "Quiz",
        category: "cat",
        difficulty: "easy",
        questions: [{ question: "Q", answer: "" }],
      }),
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": adminUser.email,
      },
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(typeof json.error).toBe("string");
  });

  // GET tests
  it("returns 401 if not authenticated (GET)", async () => {
    const req = new Request("http://localhost/api/quiz-review", { method: "GET" });
    const res = await GET(req as unknown as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns quizzes with filters (GET)", async () => {
    const req = new Request("http://localhost/api/quiz-review?category=cat&difficulty=easy", {
      method: "GET",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await GET(req as unknown as NextRequest);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.quizzes)).toBe(true);
  });

  // DELETE tests
  it("returns 401 if not authenticated (DELETE)", async () => {
    const req = new Request("http://localhost/api/quiz-review?id=" + quizId, { method: "DELETE" });
    const res = await DELETE(req as unknown as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns 400 if id missing (DELETE)", async () => {
    const req = new Request("http://localhost/api/quiz-review", {
      method: "DELETE",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await DELETE(req as unknown as NextRequest);
    expect(res.status).toBe(400);
  });

  it("deletes a quiz (DELETE)", async () => {
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
    createdQuizIds.add(quiz.id);
    const req = new Request("http://localhost/api/quiz-review?id=" + quiz.id, {
      method: "DELETE",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await DELETE(req as unknown as NextRequest);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    createdQuizIds.delete(quiz.id);
  });
});