import { GameRepositoryAdapter } from "@/infrastructure/game/GameRepositoryAdapter";
import * as gameRepository from "@/server/repositories/gameRepository";
import * as topicRepository from "@/server/repositories/topicRepository";
import { GameType, Prisma } from "@prisma/client";

jest.mock("@/server/repositories/gameRepository");
jest.mock("@/server/repositories/topicRepository");

describe("GameRepositoryAdapter", () => {
  let adapter: GameRepositoryAdapter;

  beforeEach(() => {
    adapter = new GameRepositoryAdapter();
    jest.clearAllMocks();
  });

  describe("createGame", () => {
    it("should create game with CLASSIC type", async () => {
      const mockGame = {
        id: "game1",
        userId: "user1",
        topic: "Science",
        gameType: GameType.CLASSIC,
        createdAt: new Date(),
      };

      (gameRepository.createGame as jest.Mock).mockResolvedValue(mockGame);

      const result = await adapter.createGame({
        userId: "user1",
        topic: "Science",
        gameType: GameType.CLASSIC,
      });

      expect(result).toEqual(mockGame);
      expect(gameRepository.createGame).toHaveBeenCalledWith({
        userId: "user1",
        topic: "Science",
        gameType: GameType.CLASSIC,
      });
    });

    it("should create game with TIMED type", async () => {
      const mockGame = {
        id: "game2",
        userId: "user1",
        topic: "Math",
        gameType: GameType.TIMED,
        createdAt: new Date(),
      };

      (gameRepository.createGame as jest.Mock).mockResolvedValue(mockGame);

      const result = await adapter.createGame({
        userId: "user1",
        topic: "Math",
        gameType: GameType.TIMED,
      });

      expect(result.gameType).toBe(GameType.TIMED);
      expect(result.topic).toBe("Math");
    });
  });

  describe("findGameById", () => {
    it("should find game by ID", async () => {
      const mockGame = {
        id: "game1",
        userId: "user1",
        topic: "Science",
        gameType: GameType.CLASSIC,
        createdAt: new Date(),
      };

      (gameRepository.findGameById as jest.Mock).mockResolvedValue(mockGame);

      const result = await adapter.findGameById("game1");

      expect(result).toEqual(mockGame);
      expect(gameRepository.findGameById).toHaveBeenCalledWith("game1");
    });

    it("should return null when game not found", async () => {
      (gameRepository.findGameById as jest.Mock).mockResolvedValue(null);

      const result = await adapter.findGameById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("endGame", () => {
    it("should mark game as ended", async () => {
      (gameRepository.markGameEnded as jest.Mock).mockResolvedValue(undefined);

      await adapter.endGame("game1");

      expect(gameRepository.markGameEnded).toHaveBeenCalledWith("game1");
    });

    it("should handle multiple end game calls", async () => {
      (gameRepository.markGameEnded as jest.Mock).mockResolvedValue(undefined);

      await adapter.endGame("game1");
      await adapter.endGame("game2");

      expect(gameRepository.markGameEnded).toHaveBeenCalledTimes(2);
      expect(gameRepository.markGameEnded).toHaveBeenNthCalledWith(1, "game1");
      expect(gameRepository.markGameEnded).toHaveBeenNthCalledWith(2, "game2");
    });
  });

  describe("trackTopic", () => {
    it("should increment topic count", async () => {
      (topicRepository.incrementTopicCount as jest.Mock).mockResolvedValue(
        undefined
      );

      await adapter.trackTopic("Science");

      expect(topicRepository.incrementTopicCount).toHaveBeenCalledWith("Science");
    });

    it("should track different topics", async () => {
      (topicRepository.incrementTopicCount as jest.Mock).mockResolvedValue(
        undefined
      );

      await adapter.trackTopic("Science");
      await adapter.trackTopic("Math");
      await adapter.trackTopic("History");

      expect(topicRepository.incrementTopicCount).toHaveBeenCalledTimes(3);
      expect(topicRepository.incrementTopicCount).toHaveBeenNthCalledWith(1, "Science");
      expect(topicRepository.incrementTopicCount).toHaveBeenNthCalledWith(2, "Math");
      expect(topicRepository.incrementTopicCount).toHaveBeenNthCalledWith(3, "History");
    });
  });

  describe("createQuestionsForGame", () => {
    it("should create multiple questions for game", async () => {
      const questionsData: Prisma.QuestionCreateManyInput[] = [
        {
          gameId: "game1",
          content: "What is 2+2?",
          type: "mcq",
          options: ["2", "4", "6"],
        },
        {
          gameId: "game1",
          content: "What is 3+3?",
          type: "mcq",
          options: ["3", "6", "9"],
        },
      ];

      (gameRepository.createQuestionsForGame as jest.Mock).mockResolvedValue(
        undefined
      );

      await adapter.createQuestionsForGame(questionsData);

      expect(gameRepository.createQuestionsForGame).toHaveBeenCalledWith(
        questionsData
      );
    });

    it("should handle empty questions array", async () => {
      (gameRepository.createQuestionsForGame as jest.Mock).mockResolvedValue(
        undefined
      );

      await adapter.createQuestionsForGame([]);

      expect(gameRepository.createQuestionsForGame).toHaveBeenCalledWith([]);
    });
  });

  describe("findGameWithQuestionsById", () => {
    it("should find game with questions by ID", async () => {
      const mockGameWithQuestions = {
        id: "game1",
        userId: "user1",
        topic: "Science",
        gameType: GameType.CLASSIC,
        questions: [
          {
            id: "q1",
            content: "What is gravity?",
            type: "open_ended",
          },
        ],
        createdAt: new Date(),
      };

      (gameRepository.findGameWithQuestionsById as jest.Mock).mockResolvedValue(
        mockGameWithQuestions
      );

      const result = await adapter.findGameWithQuestionsById("game1");

      expect(result).toEqual(mockGameWithQuestions);
      expect(result.questions).toHaveLength(1);
      expect(gameRepository.findGameWithQuestionsById).toHaveBeenCalledWith("game1");
    });

    it("should return null when game not found", async () => {
      (gameRepository.findGameWithQuestionsById as jest.Mock).mockResolvedValue(
        null
      );

      const result = await adapter.findGameWithQuestionsById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findRecentGamesByUserId", () => {
    it("should find recent games with default limit", async () => {
      const mockGames = [
        {
          id: "game1",
          userId: "user1",
          topic: "Science",
          gameType: GameType.CLASSIC,
          createdAt: new Date(),
        },
        {
          id: "game2",
          userId: "user1",
          topic: "Math",
          gameType: GameType.TIMED,
          createdAt: new Date(),
        },
      ];

      (gameRepository.findRecentGamesByUserId as jest.Mock).mockResolvedValue(
        mockGames
      );

      const result = await adapter.findRecentGamesByUserId("user1", 10);

      expect(result).toHaveLength(2);
      expect(gameRepository.findRecentGamesByUserId).toHaveBeenCalledWith("user1", 10);
    });

    it("should respect custom limit", async () => {
      const mockGames = [
        {
          id: "game1",
          userId: "user1",
          topic: "Science",
          gameType: GameType.CLASSIC,
          createdAt: new Date(),
        },
      ];

      (gameRepository.findRecentGamesByUserId as jest.Mock).mockResolvedValue(
        mockGames
      );

      await adapter.findRecentGamesByUserId("user1", 1);

      expect(gameRepository.findRecentGamesByUserId).toHaveBeenCalledWith("user1", 1);
    });

    it("should return empty array when no games found", async () => {
      (gameRepository.findRecentGamesByUserId as jest.Mock).mockResolvedValue([]);

      const result = await adapter.findRecentGamesByUserId("user1", 10);

      expect(result).toEqual([]);
    });
  });

  describe("countGamesByUserId", () => {
    it("should count games for user", async () => {
      (gameRepository.countGamesByUserId as jest.Mock).mockResolvedValue(5);

      const result = await adapter.countGamesByUserId("user1");

      expect(result).toBe(5);
      expect(gameRepository.countGamesByUserId).toHaveBeenCalledWith("user1");
    });

    it("should return 0 for user with no games", async () => {
      (gameRepository.countGamesByUserId as jest.Mock).mockResolvedValue(0);

      const result = await adapter.countGamesByUserId("user1");

      expect(result).toBe(0);
    });
  });

  describe("findGameWithQuestionsForUserOrAdmin", () => {
    it("should find game for regular user", async () => {
      const mockGame = {
        id: "game1",
        userId: "user1",
        questions: [{ id: "q1", content: "Question 1" }],
      };

      (gameRepository.findGameWithQuestionsForUserOrAdmin as jest.Mock).mockResolvedValue(
        mockGame
      );

      const result = await adapter.findGameWithQuestionsForUserOrAdmin(
        "game1",
        "user1",
        false
      );

      expect(result).toEqual(mockGame);
      expect(
        gameRepository.findGameWithQuestionsForUserOrAdmin
      ).toHaveBeenCalledWith("game1", "user1", false);
    });

    it("should find game for admin user", async () => {
      const mockGame = {
        id: "game1",
        userId: "user1",
        questions: [{ id: "q1", content: "Question 1" }],
      };

      (gameRepository.findGameWithQuestionsForUserOrAdmin as jest.Mock).mockResolvedValue(
        mockGame
      );

      const result = await adapter.findGameWithQuestionsForUserOrAdmin(
        "game1",
        "admin1",
        true
      );

      expect(result).toEqual(mockGame);
      expect(
        gameRepository.findGameWithQuestionsForUserOrAdmin
      ).toHaveBeenCalledWith("game1", "admin1", true);
    });

    it("should return null when game not found", async () => {
      (gameRepository.findGameWithQuestionsForUserOrAdmin as jest.Mock).mockResolvedValue(
        null
      );

      const result = await adapter.findGameWithQuestionsForUserOrAdmin(
        "nonexistent",
        "user1",
        false
      );

      expect(result).toBeNull();
    });
  });

  describe("findOpenEndedGameForUserOrAdmin", () => {
    it("should find open-ended game for user", async () => {
      const mockGame = {
        id: "game1",
        userId: "user1",
        gameType: GameType.OPEN_ENDED,
        questions: [{ id: "q1", content: "Explain something" }],
      };

      (gameRepository.findOpenEndedGameForUserOrAdmin as jest.Mock).mockResolvedValue(
        mockGame
      );

      const result = await adapter.findOpenEndedGameForUserOrAdmin(
        "game1",
        "user1",
        false
      );

      expect(result).toEqual(mockGame);
      expect(result.gameType).toBe(GameType.OPEN_ENDED);
      expect(
        gameRepository.findOpenEndedGameForUserOrAdmin
      ).toHaveBeenCalledWith("game1", "user1", false);
    });

    it("should find open-ended game for admin", async () => {
      const mockGame = {
        id: "game1",
        userId: "user1",
        gameType: GameType.OPEN_ENDED,
        questions: [{ id: "q1", content: "Explain something" }],
      };

      (gameRepository.findOpenEndedGameForUserOrAdmin as jest.Mock).mockResolvedValue(
        mockGame
      );

      const result = await adapter.findOpenEndedGameForUserOrAdmin(
        "game1",
        "admin1",
        true
      );

      expect(result.gameType).toBe(GameType.OPEN_ENDED);
    });

    it("should return null when game not found", async () => {
      (gameRepository.findOpenEndedGameForUserOrAdmin as jest.Mock).mockResolvedValue(
        null
      );

      const result = await adapter.findOpenEndedGameForUserOrAdmin(
        "nonexistent",
        "user1",
        false
      );

      expect(result).toBeNull();
    });
  });
});
