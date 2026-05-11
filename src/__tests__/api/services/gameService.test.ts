import {
  createGameWithTopicCount,
  endGame,
  getGameWithQuestions,
  saveGeneratedQuestionsForGame,
} from "@/server/services/gameService";
import { prisma } from "@/server/core/db";
import type { Game, User } from "@prisma/client";
import { cleanupUsersByEmail, createTestUser, uniqueEmail } from "../../utils/prismaUsers";

jest.setTimeout(30000);

describe("gameService", () => {
  let user: User;
  const userEmail = uniqueEmail("game-service-user");

  beforeAll(async () => {
    await cleanupUsersByEmail(prisma, [userEmail]);
    user = await createTestUser(prisma, { email: userEmail });
  });

  afterEach(async () => {
    const games = await prisma.game.findMany({ where: { userId: user.id }, select: { id: true } });
    const gameIds = games.map((game) => game.id);
    if (gameIds.length > 0) {
      await prisma.question.deleteMany({ where: { gameId: { in: gameIds } } });
    }
    await prisma.game.deleteMany({ where: { userId: user.id } });
    await prisma.topicCount.deleteMany({
      where: {
        OR: [
          { topic: { in: ["math", "science"] } },
          { topic: { startsWith: "game-service-topic-" } },
        ],
      },
    });
  });

  afterAll(async () => {
    await cleanupUsersByEmail(prisma, [userEmail]);
    await prisma.$disconnect();
  });

  it("creates game and increments topic count", async () => {
    const topic = `game-service-topic-${Date.now()}`;
    const before = await prisma.topicCount.findUnique({ where: { topic } });

    const result = await createGameWithTopicCount({
      userId: user.id,
      topic,
      type: "mcq",
    });

    expect(result.id).toBeDefined();

    const after = await prisma.topicCount.findUnique({ where: { topic } });
    expect(after?.count).toBe((before?.count ?? 0) + 1);
  });

  it("saves MCQ generated questions", async () => {
    const game = await createGameWithTopicCount({
      userId: user.id,
      topic: "math",
      type: "mcq",
    });

    await saveGeneratedQuestionsForGame({
      gameId: game.id,
      type: "mcq",
      questions: [
        {
          question: "2+2?",
          answer: "4",
          option1: "3",
          option2: "5",
          option3: "6",
        },
      ],
    });

    const question = await prisma.question.findFirst({ where: { gameId: game.id } });
    expect(question?.question).toBe("2+2?");
    expect(question?.answer).toBe("4");
    expect(question?.questionType).toBe("mcq");

    const options = JSON.parse(String(question?.options ?? "[]"));
    expect(options).toEqual(expect.arrayContaining(["3", "4", "5", "6"]));
  });

  it("saves open ended generated questions", async () => {
    const game = await createGameWithTopicCount({
      userId: user.id,
      topic: "science",
      type: "open_ended",
    });

    await saveGeneratedQuestionsForGame({
      gameId: game.id,
      type: "open_ended",
      questions: [{ question: "Explain gravity", answer: "Force of attraction" }],
    });

    const question = await prisma.question.findFirst({ where: { gameId: game.id } });
    expect(question?.question).toBe("Explain gravity");
    expect(question?.answer).toBe("Force of attraction");
    expect(question?.questionType).toBe("open_ended");
  });

  it("delegates game retrieval", async () => {
    const game = await createGameWithTopicCount({
      userId: user.id,
      topic: "math",
      type: "mcq",
    });
    await saveGeneratedQuestionsForGame({
      gameId: game.id,
      type: "mcq",
      questions: [
        {
          question: "Q",
          answer: "A",
          option1: "B",
          option2: "C",
          option3: "D",
        },
      ],
    });

    const loaded = await getGameWithQuestions(game.id);
    expect(loaded?.id).toBe(game.id);
    expect(loaded?.questions.length).toBe(1);
  });

  it("returns 404 when ending unknown game", async () => {
    const result = await endGame("missing");
    expect(result).toEqual({
      status: 404,
      body: { message: "Game not found" },
    });
  });

  it("marks game ended when game exists", async () => {
    const game: Game = await createGameWithTopicCount({
      userId: user.id,
      topic: "math",
      type: "mcq",
    });

    const result = await endGame(game.id);
    expect(result).toEqual({
      status: 200,
      body: { message: "Game ended" },
    });

    const ended = await prisma.game.findUnique({ where: { id: game.id } });
    expect(ended?.timeEnded).toBeTruthy();
  });
});