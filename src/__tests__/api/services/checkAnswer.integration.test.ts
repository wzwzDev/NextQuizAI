import { POST } from "@/app/api/checkAnswer/route";
import { prisma } from "@/server/core/db";
import type { User, Game, Question } from "@prisma/client";
jest.setTimeout(30000);
describe("/api/checkAnswer Route Handler", () => {
  let user: User;
  let game: Game;
  let mcqQuestion: Question;
  let openQuestion: Question;

 beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: "testuser@example.com" } }); // <-- Add this line
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
  },30000);

  afterAll(async () => {
    await prisma.question.deleteMany({ where: { gameId: game.id } });
    await prisma.game.delete({ where: { id: game.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  const callHandler = async (data: object, email?: string) => {
    const req = new Request("http://localhost/api/checkAnswer", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    const res = await POST(req);
    const json = await res?.json();
    return { status: res?.status, body: json };
  };

  it("returns 401 when user is not authenticated", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "Paris" });
    expect(res.status).toBe(401);
  });

  it("returns isCorrect=true for correct MCQ answer", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "Paris" }, user.email);
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(true);
  });

  it("returns isCorrect=false for incorrect MCQ answer", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "London" }, user.email);
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(false);
  });

  it("accepts MCQ with extra spaces and casing", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "  paRiS " }, user.email);
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(true);
  });

  it("returns 100% similarity for exact open-ended answer", async () => {
    const res = await callHandler({ questionId: openQuestion.id, userInput: "The sky is blue." }, user.email);
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBe(100);
  });

  it("returns 0% similarity for very different open-ended answer", async () => {
    const res = await callHandler({ questionId: openQuestion.id, userInput: "Banana" }, user.email);
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBe(0);
  });

  it("returns > 0 similarity for partial match", async () => {
    const res = await callHandler({ questionId: openQuestion.id, userInput: "sky is blue" }, user.email);
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBeGreaterThan(0);
  });

  it("returns 404 for non-existent question", async () => {
    const res = await callHandler({ questionId: "nonexistent", userInput: "test" }, user.email);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Question not found");
  });

  it("returns 400 for missing userInput", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id }, user.email);
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it("returns 400 for empty userInput", async () => {
    const res = await callHandler({ questionId: mcqQuestion.id, userInput: "" }, user.email);
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it("returns 400 for non-string userInput", async () => {
    const res = await callHandler(
      { questionId: mcqQuestion.id, userInput: { value: "Paris" } },
      user.email,
    );
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it("saves userAnswer and isCorrect in DB", async () => {
    await callHandler({ questionId: mcqQuestion.id, userInput: "Paris" }, user.email);
    const updated = await prisma.question.findUnique({ where: { id: mcqQuestion.id } });
    expect(updated?.userAnswer).toBe("Paris");
    expect(updated?.isCorrect).toBe(true);
  });

  it("returns 0 similarity for off-topic open-ended input", async () => {
    const res = await callHandler({ questionId: openQuestion.id, userInput: "The ocean is deep." }, user.email);
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBe(0);
  });

  it("accepts trimmed multiline execution output", async () => {
    const multilineQuestion = await prisma.question.create({
      data: {
        question: "What does this print?\nconsole.log('Hello');",
        answer: "Hello\n",
        questionType: "open_ended",
        gameId: game.id,
      },
    });

    const res = await callHandler(
      { questionId: multilineQuestion.id, userInput: "  Hello  \n\n" },
      user.email,
    );

    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBe(100);

    await prisma.question.delete({ where: { id: multilineQuestion.id } });
  });

  it("returns 400 for invalid questionId format (number instead of string)", async () => {
    const res = await callHandler({ questionId: "12345", userInput: "Paris" }, user.email);
    expect([400, 404]).toContain(res.status);
  });

 it("returns 400 for whitespace-only MCQ answer", async () => {
  const res = await callHandler({ questionId: mcqQuestion.id, userInput: "    " }, user.email);
  expect(res.status).toBe(400);
  expect(res.body.message).toBeDefined();
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

    const res = await callHandler({ questionId: blank.id, userInput: "Anything" }, user.email);
    expect(res.status).toBe(200);
    expect(res.body.percentageSimilar).toBe(0);

    await prisma.question.delete({ where: { id: blank.id } });
  });

  it("returns 400 on invalid JSON", async () => {
    const badRequest = new Request("http://localhost/api/checkAnswer", {
      method: "POST",
      body: "not-json",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": user.email,
      },
    });

    const res = await POST(badRequest);
    expect(res?.status).toBe(400);
  });
});