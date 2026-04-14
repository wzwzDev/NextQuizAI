import { GET } from "@/app/api/start-quiz/route";
import { prisma } from "@/server/core/db";
jest.setTimeout(30000);
describe("/api/start-quiz Route Handler", () => {
  let quiz: any;

  beforeAll(async () => {
    quiz = await prisma.adminQuiz.create({
      data: {
        title: "Sample Quiz",
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
  },30000);

  afterAll(async () => {
    await prisma.adminQuiz.deleteMany({});
    await prisma.$disconnect();
  });

  it("returns 400 if quizId is missing", async () => {
    const req = new Request("http://localhost/api/start-quiz", { method: "GET" });
    const res = await GET(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Quiz ID is required/i);
  });

  it("returns 404 if quiz not found", async () => {
    const req = new Request("http://localhost/api/start-quiz?id=nonexistentid", { method: "GET" });
    const res = await GET(req as any);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/Quiz not found/i);
  });

  it("returns quiz if found and approved", async () => {
    const req = new Request(`http://localhost/api/start-quiz?id=${quiz.id}`, { method: "GET" });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.quiz).toBeDefined();
    expect(json.quiz.questions.length).toBe(2);
    expect(json.quiz.title).toBe("Sample Quiz");
  });
});