import { POST } from "@/app/api/checkAnswer/route";
import { prisma } from "@/lib/db";
import type { User, Game, Question } from "@prisma/client";

describe("/api/checkAnswer Route Handler", () => {
  let user: User;
  let game: Game;
  let mcqQuestion: Question;
  let openQuestion: Question;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: { email: "testuser@example.com" },
    });

    game = await prisma.game.create({
      data: {
        userId: user.id,
        timeStarted: new Date(),
        topic: "General Knowledge",
        gameType: "mcq",
      },
    });

    mcqQuestion = await prisma.question.create({
      data: {
        question: "What is the capital of France?",
        answer: "Paris",
        questionType: "mcq",
        gameId: game.id,
      },
    });

    openQuestion = await prisma.question.create({
      data: {
        question: "Describe the sky.",
        answer: "The sky is blue.",
        questionType: "open_ended",
        gameId: game.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.question.deleteMany({ where: { gameId: game.id } });
    await prisma.game.delete({ where: { id: game.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  const callHandler = async (data: object) => {
    const req = new Request("http://localhost/api/checkAnswer", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, {} as Response);
    const json = await res?.json();
    return { status: res?.status, body: json };
  };

  it("returns isCorrect=true for correct MCQ answer", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "Paris" });
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(true);
  });

  it("returns isCorrect=false for incorrect MCQ answer", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "London" });
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(false);
  });

  it("accepts MCQ with extra spaces and casing", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "  paRiS " });
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(true);
  });

  it("returns 100% similarity for exact open-ended answer", async () => {
    const res = await callHandler({ questionId: openQuestion.id, userInput: "The sky is blue." });
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBe(100);
  });

  it("returns 0% similarity for very different open-ended answer", async () => {
    const res = await callHandler({ questionId: openQuestion.id, userInput: "Banana" });
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBe(0);
  });

  it("returns > 0 similarity for partial match", async () => {
    const res = await callHandler({ questionId: openQuestion.id, userInput: "sky is blue" });
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBeGreaterThan(0);
  });

  it("returns 404 for non-existent question", async () => {
    const res = await callHandler({ questionId: "nonexistent", userInput: "test" });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Question not found");
  });

  it("returns 400 for missing userInput", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it("returns 400 for empty userInput", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it("saves userAnswer and isCorrect in DB", async () => {
    await callHandler({ questionId: mcqQuestion.id, userInput: "Paris" });
    const updated = await prisma.question.findUnique({ where: { id: mcqQuestion.id } });
    expect(updated?.userAnswer).toBe("Paris");
    expect(updated?.isCorrect).toBe(true);
  });

  it("returns 0 similarity for off-topic open-ended input", async () => {
    const res = await callHandler({ questionId: openQuestion.id, userInput: "The ocean is deep." });
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBe(0);
  });

  it("returns 400 for invalid questionId format (number instead of string)", async () => {
    const res = await callHandler({ questionId: "12345", userInput: "Paris" });
    expect([400, 404]).toContain(res.status);
  });

  it("returns false for whitespace-only MCQ answer", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "    " });
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(false);
  });

  it("handles open-ended question with empty answer in DB", async () => {
    const blank = await prisma.question.create({
      data: {
        question: "What is empty?",
        answer: "",
        questionType: "open_ended",
        gameId: game.id,
      },
    });

    const res = await callHandler({ questionId: blank.id, userInput: "Anything" });
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBe(0);

    await prisma.question.delete({ where: { id: blank.id } });
  });

  it("returns 500 on invalid JSON", async () => {
    const badRequest = new Request("http://localhost/api/checkAnswer", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(badRequest, {} as Response);
    expect(res?.status).toBe(500);
  });
});