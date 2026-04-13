jest.mock("@/lib/db", () => ({
  prisma: {
    game: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    question: {
      createMany: jest.fn(),
    },
  },
}));

import {
  createGame,
  createQuestionsForGame,
  findGameById,
  findGameWithQuestionsById,
  markGameEnded,
} from "@/lib/repositories/gameRepository";
import { prisma } from "@/lib/db";

describe("gameRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a game", async () => {
    await createGame({ userId: "u1", topic: "math", gameType: "mcq" });
    expect(prisma.game.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "u1" }) }),
    );
  });

  it("finds game by id", async () => {
    await findGameById("g1");
    expect(prisma.game.findUnique).toHaveBeenCalledWith({ where: { id: "g1" } });
  });

  it("finds game with questions", async () => {
    await findGameWithQuestionsById("g1");
    expect(prisma.game.findUnique).toHaveBeenCalledWith({
      where: { id: "g1" },
      include: { questions: true },
    });
  });

  it("marks game ended", async () => {
    await markGameEnded("g1");
    expect(prisma.game.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "g1" }, data: expect.any(Object) }),
    );
  });

  it("creates many questions for game", async () => {
    await createQuestionsForGame([
      {
        gameId: "g1",
        question: "Q",
        answer: "A",
        questionType: "mcq",
      },
    ] as any);

    expect(prisma.question.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ gameId: "g1", question: "Q", answer: "A" }),
      ],
    });
  });
});