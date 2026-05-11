import {
  countGamesByUserId,
  createGame,
  createQuestionsForGame,
  findGameById,
  findGameWithQuestionsForUserOrAdmin,
  findGameWithQuestionsById,
  findOpenEndedGameForUserOrAdmin,
  findRecentGamesByUserId,
  markGameEnded,
} from "@/server/repositories/gameRepository";
import { prisma } from "@/server/core/db";
import type { Prisma } from "@prisma/client";
import type { Game, User } from "@prisma/client";
import {
  cleanupUsersByEmail,
  createTestUser,
  uniqueEmail,
} from "../../utils/prismaUsers";

jest.setTimeout(30000);

describe("gameRepository", () => {
  let user: User;
  let game: Game;
  const userEmail = uniqueEmail("game-repo-user");

  beforeAll(async () => {
    await cleanupUsersByEmail(prisma, [userEmail]);
    user = await createTestUser(prisma, { email: userEmail });
    game = await prisma.game.create({
      data: {
        userId: user.id,
        topic: "math",
        gameType: "mcq",
        timeStarted: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.question.deleteMany({ where: { gameId: game.id } });
    await prisma.game.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await cleanupUsersByEmail(prisma, [userEmail]);
    await prisma.$disconnect();
  });

  it("creates a game", async () => {
    const created = await createGame({ userId: user.id, topic: "science", gameType: "open_ended" });
    expect(created.userId).toBe(user.id);
    expect(created.topic).toBe("science");
  });

  it("finds game by id", async () => {
    const found = await findGameById(game.id);
    expect(found?.id).toBe(game.id);
  });

  it("finds game with questions", async () => {
    await prisma.question.create({
      data: {
        gameId: game.id,
        question: "2+2?",
        answer: "4",
        questionType: "mcq",
      },
    });

    const withQuestions = await findGameWithQuestionsById(game.id);
    expect(withQuestions?.questions.length).toBeGreaterThan(0);
  });

  it("marks game ended", async () => {
    await markGameEnded(game.id);
    const updated = await prisma.game.findUnique({ where: { id: game.id } });
    expect(updated?.timeEnded).toBeTruthy();
  });

  it("creates many questions for game", async () => {
    const questionPayload: Prisma.QuestionCreateManyInput[] = [
      {
        gameId: game.id,
        question: "Q",
        answer: "A",
        questionType: "mcq",
      },
    ];

    await createQuestionsForGame(questionPayload);

    const created = await prisma.question.findMany({ where: { gameId: game.id, question: "Q" } });
    expect(created.length).toBeGreaterThan(0);
  });

  it("finds game for user/admin access variants", async () => {
    const asOwner = await findGameWithQuestionsForUserOrAdmin(game.id, user.id, false);
    expect(asOwner?.id).toBe(game.id);

    const asAdmin = await findGameWithQuestionsForUserOrAdmin(game.id, "other-user", true);
    expect(asAdmin?.id).toBe(game.id);
  });

  it("returns open-ended game projection and supports recents/count", async () => {
    const projection = await findOpenEndedGameForUserOrAdmin(game.id, user.id, false);
    expect(projection?.questions).toBeDefined();

    const recent = await findRecentGamesByUserId(user.id, 5);
    expect(Array.isArray(recent)).toBe(true);

    const count = await countGamesByUserId(user.id);
    expect(count).toBeGreaterThan(0);
  });
});