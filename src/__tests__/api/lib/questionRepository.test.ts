import {
  findQuestionById,
  saveMcqResult,
  saveOpenEndedResult,
  saveUserAnswer,
} from "@/server/repositories/questionRepository";
import { prisma } from "@/server/core/db";
import type { Game, Question, User } from "@prisma/client";

jest.setTimeout(30000);

describe("questionRepository", () => {
  let user: User;
  let game: Game;
  let question: Question;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: "question-repo-user@example.com" } });
    user = await prisma.user.create({ data: { email: "question-repo-user@example.com" } });
    game = await prisma.game.create({
      data: {
        userId: user.id,
        topic: "history",
        gameType: "open_ended",
        timeStarted: new Date(),
      },
    });
    question = await prisma.question.create({
      data: {
        gameId: game.id,
        question: "Capital of France?",
        answer: "Paris",
        questionType: "open_ended",
      },
    });
  });

  afterAll(async () => {
    await prisma.question.deleteMany({ where: { gameId: game.id } });
    await prisma.game.deleteMany({ where: { id: game.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  it("finds question by id", async () => {
    const found = await findQuestionById(question.id);
    expect(found?.id).toBe(question.id);
  });

  it("saves user answer", async () => {
    await saveUserAnswer(question.id, "Paris");
    const updated = await prisma.question.findUnique({ where: { id: question.id } });
    expect(updated?.userAnswer).toBe("Paris");
  });

  it("saves mcq result", async () => {
    await saveMcqResult(question.id, true);
    const updated = await prisma.question.findUnique({ where: { id: question.id } });
    expect(updated?.isCorrect).toBe(true);
  });

  it("saves open-ended result", async () => {
    await saveOpenEndedResult(question.id, 88);
    const updated = await prisma.question.findUnique({ where: { id: question.id } });
    expect(updated?.percentageCorrect).toBe(88);
  });
});