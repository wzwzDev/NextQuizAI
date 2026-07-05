import { Question } from "@/domain/entities/Question";
import type { GameType } from "@/domain/value-objects/DomainEnums";

describe("Question", () => {
  describe("constructor", () => {
    it("should create question with all properties", () => {
      const question = new Question(
        "q1",
        "What is 2+2?",
        "4",
        "game1",
        ["1", "2", "4", "6"],
        85.5,
        true,
        "mcq" as GameType,
        "4"
      );

      expect(question.id).toBe("q1");
      expect(question.question).toBe("What is 2+2?");
      expect(question.answer).toBe("4");
      expect(question.gameId).toBe("game1");
      expect(question.options).toEqual(["1", "2", "4", "6"]);
      expect(question.percentageCorrect).toBe(85.5);
      expect(question.isCorrect).toBe(true);
      expect(question.questionType).toBe("mcq");
      expect(question.userAnswer).toBe("4");
    });

    it("should handle null optional properties", () => {
      const question = new Question(
        "q1",
        "Question",
        "Answer",
        "game1",
        null,
        null,
        null,
        "mcq" as GameType,
        null
      );

      expect(question.options).toBeNull();
      expect(question.percentageCorrect).toBeNull();
      expect(question.isCorrect).toBeNull();
      expect(question.userAnswer).toBeNull();
    });

    it("should handle open_ended game type", () => {
      const question = new Question(
        "q1",
        "Explain gravity",
        "Gravity is...",
        "game1",
        null,
        75,
        true,
        "open_ended" as GameType,
        "My answer"
      );

      expect(question.questionType).toBe("open_ended");
    });
  });

  describe("fromPrisma", () => {
    it("should create Question from prisma data", () => {
      const prismaData = {
        id: "q1",
        question: "What is 2+2?",
        answer: "4",
        gameId: "game1",
        options: ["1", "2", "4", "6"],
        percentageCorrect: 85.5,
        isCorrect: true,
        questionType: "mcq",
        userAnswer: "4",
      };

      const question = Question.fromPrisma(prismaData);

      expect(question).not.toBeNull();
      expect(question!.id).toBe("q1");
      expect(question!.question).toBe("What is 2+2?");
      expect(question!.answer).toBe("4");
      expect(question!.gameId).toBe("game1");
      expect(question!.options).toEqual(["1", "2", "4", "6"]);
      expect(question!.percentageCorrect).toBe(85.5);
      expect(question!.isCorrect).toBe(true);
      expect(question!.questionType).toBe("mcq");
      expect(question!.userAnswer).toBe("4");
    });

    it("should return null for null input", () => {
      const result = Question.fromPrisma(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = Question.fromPrisma(undefined);
      expect(result).toBeNull();
    });

    it("should handle missing properties with defaults", () => {
      const prismaData = {};
      const question = Question.fromPrisma(prismaData);

      expect(question).not.toBeNull();
      expect(question!.id).toBe("");
      expect(question!.question).toBe("");
      expect(question!.answer).toBe("");
      expect(question!.gameId).toBe("");
      expect(question!.options).toBeNull();
      expect(question!.percentageCorrect).toBeNull();
      expect(question!.isCorrect).toBeNull();
      expect(question!.questionType).toBe("mcq");
      expect(question!.userAnswer).toBeNull();
    });

    it("should convert numeric strings to numbers", () => {
      const prismaData = {
        id: "123",
        question: "q",
        answer: "a",
        gameId: "g1",
        percentageCorrect: "92.5",
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.percentageCorrect).toBe(92.5);
      expect(typeof question!.percentageCorrect).toBe("number");
    });

    it("should convert to boolean for isCorrect", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        isCorrect: "true",
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.isCorrect).toBe(true);
    });

    it("should handle isCorrect false", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        isCorrect: false,
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.isCorrect).toBe(false);
    });

    it("should handle percentageCorrect zero", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        percentageCorrect: 0,
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.percentageCorrect).toBe(0);
      expect(question!.percentageCorrect).not.toBeNull();
    });

    it("should handle open_ended question type", () => {
      const prismaData = {
        id: "q1",
        question: "Explain",
        answer: "Answer",
        gameId: "g1",
        questionType: "open_ended",
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.questionType).toBe("open_ended");
    });

    it("should handle undefined percentageCorrect", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        percentageCorrect: undefined,
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.percentageCorrect).toBeNull();
    });

    it("should handle undefined isCorrect", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        isCorrect: undefined,
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.isCorrect).toBeNull();
    });

    it("should handle empty userAnswer string", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        userAnswer: "",
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.userAnswer).toBeNull();
    });

    it("should handle non-empty userAnswer", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        userAnswer: "user_response",
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.userAnswer).toBe("user_response");
    });

    it("should handle complex options array", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        options: [
          { text: "Option 1", correct: true },
          { text: "Option 2", correct: false },
        ],
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.options).toEqual([
        { text: "Option 1", correct: true },
        { text: "Option 2", correct: false },
      ]);
    });

    it("should handle very high percentageCorrect", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        percentageCorrect: 100,
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.percentageCorrect).toBe(100);
    });

    it("should handle fractional percentageCorrect", () => {
      const prismaData = {
        id: "q1",
        question: "q",
        answer: "a",
        gameId: "g1",
        percentageCorrect: 33.333,
      };

      const question = Question.fromPrisma(prismaData);

      expect(question!.percentageCorrect).toBe(33.333);
    });
  });


});
