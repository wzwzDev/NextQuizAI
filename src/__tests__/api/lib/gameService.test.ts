import {
  createGameWithTopicCount,
  endGame,
  getGameWithQuestions,
  saveGeneratedQuestionsForGame,
} from "@/lib/services/gameService";
import {
  createGame,
  createQuestionsForGame,
  findGameById,
  findGameWithQuestionsById,
  markGameEnded,
} from "@/lib/repositories/gameRepository";
import { incrementTopicCount } from "@/lib/repositories/topicRepository";

jest.mock("@/lib/repositories/gameRepository", () => ({
  createGame: jest.fn(),
  createQuestionsForGame: jest.fn(),
  findGameById: jest.fn(),
  findGameWithQuestionsById: jest.fn(),
  markGameEnded: jest.fn(),
}));

jest.mock("@/lib/repositories/topicRepository", () => ({
  incrementTopicCount: jest.fn(),
}));

describe("gameService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates game and increments topic count", async () => {
    (createGame as jest.Mock).mockResolvedValue({ id: "game-1" });

    const result = await createGameWithTopicCount({
      userId: "user-1",
      topic: "math",
      type: "mcq",
    });

    expect(result.id).toBe("game-1");
    expect(createGame).toHaveBeenCalledWith({
      userId: "user-1",
      topic: "math",
      gameType: "mcq",
    });
    expect(incrementTopicCount).toHaveBeenCalledWith("math");
  });

  it("saves MCQ generated questions", async () => {
    await saveGeneratedQuestionsForGame({
      gameId: "game-1",
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

    expect(createQuestionsForGame).toHaveBeenCalledTimes(1);
    const [payload] = (createQuestionsForGame as jest.Mock).mock.calls[0];
    expect(payload[0]).toEqual(
      expect.objectContaining({
        question: "2+2?",
        answer: "4",
        gameId: "game-1",
        questionType: "mcq",
      }),
    );

    const options = JSON.parse(payload[0].options);
    expect(options).toEqual(expect.arrayContaining(["3", "4", "5", "6"]));
  });

  it("saves open ended generated questions", async () => {
    await saveGeneratedQuestionsForGame({
      gameId: "game-1",
      type: "open_ended",
      questions: [{ question: "Explain gravity", answer: "Force of attraction" }],
    });

    const [payload] = (createQuestionsForGame as jest.Mock).mock.calls[0];
    expect(payload[0]).toEqual(
      expect.objectContaining({
        question: "Explain gravity",
        answer: "Force of attraction",
        gameId: "game-1",
        questionType: "open_ended",
      }),
    );
  });

  it("delegates game retrieval", async () => {
    (findGameWithQuestionsById as jest.Mock).mockResolvedValue({ id: "game-1" });
    await getGameWithQuestions("game-1");
    expect(findGameWithQuestionsById).toHaveBeenCalledWith("game-1");
  });

  it("returns 404 when ending unknown game", async () => {
    (findGameById as jest.Mock).mockResolvedValue(null);

    const result = await endGame("missing");
    expect(result).toEqual({
      status: 404,
      body: { message: "Game not found" },
    });
    expect(markGameEnded).not.toHaveBeenCalled();
  });

  it("marks game ended when game exists", async () => {
    (findGameById as jest.Mock).mockResolvedValue({ id: "game-1" });

    const result = await endGame("game-1");
    expect(markGameEnded).toHaveBeenCalledWith("game-1");
    expect(result).toEqual({
      status: 200,
      body: { message: "Game ended" },
    });
  });
});