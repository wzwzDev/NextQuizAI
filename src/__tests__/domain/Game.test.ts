import { Game } from "@/domain/entities/Game";
import { Question } from "@/domain/entities/Question";
import type { GameType } from "@/domain/value-objects/DomainEnums";

describe("Game", () => {
  describe("constructor", () => {
    it("should create game with all properties", () => {
      const timeStarted = new Date("2024-01-15T10:00:00Z");
      const timeEnded = new Date("2024-01-15T11:00:00Z");
      const questions = [
        new Question("q1", "Q1", "A1", "game1", null, 80, true, "mcq" as GameType, "A1"),
      ];

      const game = new Game(
        "game1",
        "user1",
        timeStarted,
        "Science",
        timeEnded,
        "mcq" as GameType,
        questions
      );

      expect(game.id).toBe("game1");
      expect(game.userId).toBe("user1");
      expect(game.timeStarted).toEqual(timeStarted);
      expect(game.topic).toBe("Science");
      expect(game.timeEnded).toEqual(timeEnded);
      expect(game.gameType).toBe("mcq");
      expect(game.questions).toEqual(questions);
    });

    it("should handle game with no end time", () => {
      const timeStarted = new Date();
      const questions: Question[] = [];

      const game = new Game(
        "game1",
        "user1",
        timeStarted,
        "Math",
        null,
        "open_ended" as GameType,
        questions
      );

      expect(game.timeEnded).toBeNull();
      expect(game.gameType).toBe("open_ended");
    });

    it("should handle multiple questions", () => {
      const timeStarted = new Date();
      const questions = [
        new Question("q1", "Q1", "A1", "game1", ["opt1"], 50, true, "mcq" as GameType, "opt1"),
        new Question("q2", "Q2", "A2", "game1", ["opt2"], 75, false, "mcq" as GameType, "opt3"),
        new Question("q3", "Q3", "A3", "game1", null, 100, true, "mcq" as GameType, "A3"),
      ];

      const game = new Game("game1", "user1", timeStarted, "History", null, "mcq" as GameType, questions);

      expect(game.questions).toHaveLength(3);
    });
  });

  describe("fromPrisma", () => {
    it("should create Game from prisma data with all properties", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date("2024-01-15T10:00:00Z"),
        topic: "Science",
        timeEnded: new Date("2024-01-15T11:00:00Z"),
        gameType: "mcq",
        questions: [
          {
            id: "q1",
            question: "What is 2+2?",
            answer: "4",
            gameId: "game1",
            options: ["1", "4", "6"],
            percentageCorrect: 100,
            isCorrect: true,
            questionType: "mcq",
            userAnswer: "4",
          },
        ],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game).not.toBeNull();
      expect(game!.id).toBe("game1");
      expect(game!.userId).toBe("user1");
      expect(game!.topic).toBe("Science");
      expect(game!.gameType).toBe("mcq");
      expect(game!.questions).toHaveLength(1);
      expect(game!.questions[0].id).toBe("q1");
    });

    it("should return null for null input", () => {
      const result = Game.fromPrisma(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = Game.fromPrisma(undefined);
      expect(result).toBeNull();
    });

    it("should handle missing properties with defaults", () => {
      const prismaData = {};
      const game = Game.fromPrisma(prismaData);

      expect(game).not.toBeNull();
      expect(game!.id).toBe("");
      expect(game!.userId).toBe("");
      expect(game!.topic).toBe("");
      expect(game!.gameType).toBe("mcq");
      expect(game!.timeEnded).toBeNull();
      expect(game!.questions).toEqual([]);
    });

    it("should handle game with no end time", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date(),
        topic: "Science",
        timeEnded: null,
        gameType: "mcq",
        questions: [],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.timeEnded).toBeNull();
    });

    it("should handle game with undefined end time", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date(),
        topic: "Science",
        gameType: "mcq",
        questions: [],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.timeEnded).toBeNull();
    });

    it("should filter out null questions", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date(),
        topic: "Science",
        questions: [
          {
            id: "q1",
            question: "Q1",
            answer: "A1",
            gameId: "game1",
          },
          null,
          {
            id: "q2",
            question: "Q2",
            answer: "A2",
            gameId: "game1",
          },
        ],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.questions).toHaveLength(2);
      expect(game!.questions[0].id).toBe("q1");
      expect(game!.questions[1].id).toBe("q2");
    });

    it("should handle empty questions array", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date(),
        topic: "Science",
        questions: [],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.questions).toEqual([]);
    });

    it("should handle undefined questions", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date(),
        topic: "Science",
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.questions).toEqual([]);
    });

    it("should handle multiple questions with mixed valid/invalid", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date(),
        topic: "Science",
        questions: [
          { id: "q1", question: "Q1", answer: "A1", gameId: "game1" },
          null,
          { id: "q2", question: "Q2", answer: "A2", gameId: "game1" },
          null,
          { id: "q3", question: "Q3", answer: "A3", gameId: "game1" },
        ],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.questions).toHaveLength(3);
    });

    it("should handle string timestamps", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: "2024-01-15T10:00:00Z",
        topic: "Science",
        timeEnded: "2024-01-15T11:00:00Z",
        questions: [],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.timeStarted).toBeInstanceOf(Date);
      expect(game!.timeEnded).toBeInstanceOf(Date);
    });

    it("should handle open_ended game type", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date(),
        topic: "Science",
        gameType: "open_ended",
        questions: [],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.gameType).toBe("open_ended");
    });

    it("should default to mcq when gameType is not set", () => {
      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date(),
        topic: "Science",
        questions: [],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.gameType).toBe("mcq");
    });

    it("should convert numeric/boolean values to strings when needed", () => {
      const prismaData = {
        id: 12345,
        userId: 67890,
        timeStarted: new Date(),
        topic: 99999,
        questions: [],
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.id).toBe("12345");
      expect(game!.userId).toBe("67890");
      expect(game!.topic).toBe("99999");
    });

    it("should handle game with many questions", () => {
      const questionsData = Array.from({ length: 50 }, (_, i) => ({
        id: `q${i}`,
        question: `Question ${i}`,
        answer: `Answer ${i}`,
        gameId: "game1",
      }));

      const prismaData = {
        id: "game1",
        userId: "user1",
        timeStarted: new Date(),
        topic: "Large Quiz",
        questions: questionsData,
      };

      const game = Game.fromPrisma(prismaData);

      expect(game!.questions).toHaveLength(50);
    });
  });


});
