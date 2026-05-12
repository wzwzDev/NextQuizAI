import { GET, POST } from "@/app/api/start-quiz/route";
import { prisma } from "@/server/core/db";
import { cleanupUsersByEmail, createTestUser, uniqueEmail } from "../../utils/prismaUsers";
jest.setTimeout(30000);
describe("/api/start-quiz Route Handler", () => {
  let quiz;
  let user;
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
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 if quizId is missing", async () => {
    const req = new Request("http://localhost/api/start-quiz", {
      method: "GET",
      headers: { "x-test-user-email": user.email },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Quiz ID is required/i);
  });

  it("returns 404 if quiz not found", async () => {
    const req = new Request("http://localhost/api/start-quiz?id=nonexistentid", {
      method: "GET",
      headers: { "x-test-user-email": user.email },
    });
    const res = await GET(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/Quiz not found/i);
  });

  it("returns quiz if found and approved", async () => {
    const req = new Request(`http://localhost/api/start-quiz?id=${quiz.id}`, {
      method: "GET",
      headers: { "x-test-user-email": user.email },
    });
    const res = await GET(req);
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

    const res = await POST(req);
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

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid JSON");
  });

  it("allows a second attempt until the limit is reached", async () => {
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

    const firstRes = await POST(firstReq);
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

    const secondRes = await POST(secondReq);
    const secondJson = await secondRes.json();
    expect(secondRes.status).toBe(200);

    const thirdReq = new Request("http://localhost/api/start-quiz", {
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

    const thirdRes = await POST(thirdReq);
    expect(thirdRes.status).toBe(403);
    const thirdJson = await thirdRes.json();
    expect(thirdJson.error).toMatch(/completed 2 of 2 allowed attempt/i);
  });

  it("returns limit exceeded on GET after all attempts are used", async () => {
    await prisma.userQuizAttempt.deleteMany({
      where: { userId: user.id, quizId: quiz.id },
    });

    await prisma.userQuizAttempt.createMany({
      data: [
        {
          userId: user.id,
          quizId: quiz.id,
          quizTitle: quizTitle,
          status: "completed",
          score: 90,
          answers: {},
        },
        {
          userId: user.id,
          quizId: quiz.id,
          quizTitle: quizTitle,
          status: "completed",
          score: 95,
          answers: {},
        },
      ],
    });

    const req = new Request(`http://localhost/api/start-quiz?id=${quiz.id}`, {
      method: "GET",
      headers: { "x-test-user-email": user.email },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.attemptStatus).toBe("limit_exceeded");
  });
});