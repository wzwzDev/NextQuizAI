import { GET, POST } from "@/app/api/start-quiz/route";
import { prisma } from "@/server/core/db";
import { cleanupUsersByEmail, createTestUser, uniqueEmail } from "../../utils/prismaUsers";
jest.setTimeout(30000);
describe("/api/start-quiz Route Handler", () => {
  let quiz: any;
  let user: { id: string; email: string };
  const quizTitle = `startquiz-suite-sample-quiz-${Date.now()}`;
  const userEmail = uniqueEmail("startquiz-user");

  beforeAll(async () => {
    await cleanupUsersByEmail(prisma, [userEmail]);
    await prisma.adminQuiz.deleteMany({ where: { title: quizTitle } });
    const createdUser = await createTestUser(prisma, { email: userEmail });
    user = { id: createdUser.id, email: createdUser.email };

    quiz = await prisma.adminQuiz.create({
      data: {
        title: quizTitle,
        category: "general",
        difficulty: "easy",
        status: "approved",
        questions: {
          create: [
            { question: "Q1", answer: "A1" },
            { question: "Q2", answer: "A2" },
          ],
        },
      },
      include: { questions: true },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.userQuizAttempt.deleteMany({
      where: {
        OR: [{ quizId: quiz.id }, { userId: user.id }],
      },
    });
    await prisma.adminQuiz.deleteMany({ where: { title: quizTitle } });
    await cleanupUsersByEmail(prisma, [userEmail]);
    await prisma.$disconnect();
  });

  it("returns 401 when unauthenticated", async () => {
    const req = new Request("http://localhost/api/start-quiz?id=nonexistentid", {
      method: "GET",
    });
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 400 if quizId is missing", async () => {
    const req = new Request("http://localhost/api/start-quiz", {
      method: "GET",
      headers: { "x-test-user-email": user.email },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Quiz ID is required/i);
  });

  it("returns 404 if quiz not found", async () => {
    const req = new Request("http://localhost/api/start-quiz?id=nonexistentid", {
      method: "GET",
      headers: { "x-test-user-email": user.email },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/Quiz not found/i);
  });

  it("returns quiz if found and approved", async () => {
    const req = new Request(`http://localhost/api/start-quiz?id=${quiz.id}`, {
      method: "GET",
      headers: { "x-test-user-email": user.email },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.quiz).toBeDefined();
    expect(json.quiz.questions.length).toBe(2);
    expect(json.quiz.title).toBe(quizTitle);
  });

  it("returns 401 for unauthenticated POST", async () => {
    const req = new Request("http://localhost/api/start-quiz", {
      method: "POST",
      body: JSON.stringify({
        quizId: quiz.id,
        answers: ["A1", "A2"],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON in POST", async () => {
    const req = new Request("http://localhost/api/start-quiz", {
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

  it("completes an attempt then blocks retake on POST", async () => {
    const firstReq = new Request("http://localhost/api/start-quiz", {
      method: "POST",
      body: JSON.stringify({
        quizId: quiz.id,
        answers: ["A1", "A2"],
      }),
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": user.email,
      },
    });

    const firstRes = await POST(firstReq as any);
    expect(firstRes.status).toBe(200);

    const secondReq = new Request("http://localhost/api/start-quiz", {
      method: "POST",
      body: JSON.stringify({
        quizId: quiz.id,
        answers: ["A1", "A2"],
      }),
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": user.email,
      },
    });

    const secondRes = await POST(secondReq as any);
    expect(secondRes.status).toBe(409);
    const secondJson = await secondRes.json();
    expect(secondJson.error).toMatch(/already completed/i);
  });

  it("returns completed status on GET after quiz completion", async () => {
    const req = new Request(`http://localhost/api/start-quiz?id=${quiz.id}`, {
      method: "GET",
      headers: { "x-test-user-email": user.email },
    });

    const res = await GET(req as any);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.attemptStatus).toBe("completed");
  });
});