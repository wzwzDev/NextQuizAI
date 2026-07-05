import { QuizQuestion } from "@/domain/entities/QuizQuestion";

describe("QuizQuestion Entity", () => {
  describe("constructor", () => {
    it("should create a new QuizQuestion instance with valid data", () => {
      const quizQuestion = new QuizQuestion(1, 2, "What is 2+2?", "4");
      
      expect(quizQuestion.id).toBe(1);
      expect(quizQuestion.quizId).toBe(2);
      expect(quizQuestion.text).toBe("What is 2+2?");
      expect(quizQuestion.answer).toBe("4");
    });

    it("should accept zero values", () => {
      const quizQuestion = new QuizQuestion(0, 0, "", "");
      
      expect(quizQuestion.id).toBe(0);
      expect(quizQuestion.quizId).toBe(0);
      expect(quizQuestion.text).toBe("");
      expect(quizQuestion.answer).toBe("");
    });

    it("should accept large numbers", () => {
      const quizQuestion = new QuizQuestion(999999, 888888, "Large IDs", "Test");
      
      expect(quizQuestion.id).toBe(999999);
      expect(quizQuestion.quizId).toBe(888888);
    });
  });

  describe("fromPrisma", () => {
    it("should return null when input is null", () => {
      expect(QuizQuestion.fromPrisma(null)).toBeNull();
    });

    it("should return null when input is undefined", () => {
      expect(QuizQuestion.fromPrisma(undefined)).toBeNull();
    });

    it("should create QuizQuestion from valid Prisma object", () => {
      const prismaData = {
        id: 5,
        quizId: 10,
        text: "Sample question",
        answer: "Sample answer",
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(5);
      expect(result?.quizId).toBe(10);
      expect(result?.text).toBe("Sample question");
      expect(result?.answer).toBe("Sample answer");
    });

    it("should handle missing id field by defaulting to 0", () => {
      const prismaData = {
        quizId: 10,
        text: "Test",
        answer: "Answer",
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result?.id).toBe(0);
    });

    it("should handle missing quizId field by defaulting to 0", () => {
      const prismaData = {
        id: 5,
        text: "Test",
        answer: "Answer",
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result?.quizId).toBe(0);
    });

    it("should handle missing text field by defaulting to empty string", () => {
      const prismaData = {
        id: 5,
        quizId: 10,
        answer: "Answer",
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result?.text).toBe("");
    });

    it("should handle missing answer field by defaulting to empty string", () => {
      const prismaData = {
        id: 5,
        quizId: 10,
        text: "Question",
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result?.answer).toBe("");
    });

    it("should handle all fields missing", () => {
      const result = QuizQuestion.fromPrisma({});

      expect(result?.id).toBe(0);
      expect(result?.quizId).toBe(0);
      expect(result?.text).toBe("");
      expect(result?.answer).toBe("");
    });

    it("should convert string numbers to numbers for id and quizId", () => {
      const prismaData = {
        id: "123",
        quizId: "456",
        text: "Test",
        answer: "Answer",
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result?.id).toBe(123);
      expect(result?.quizId).toBe(456);
      expect(typeof result?.id).toBe("number");
      expect(typeof result?.quizId).toBe("number");
    });

    it("should handle non-numeric id values", () => {
      const prismaData = {
        id: "not-a-number",
        quizId: 10,
        text: "Test",
        answer: "Answer",
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(Number.isNaN(result?.id ?? Number.NaN)).toBe(true);
    });

    it("should handle Prisma object as unknown type", () => {
      const unknownData: unknown = {
        id: 7,
        quizId: 8,
        text: "Mystery",
        answer: "Unknown",
      };

      const result = QuizQuestion.fromPrisma(unknownData);

      expect(result?.id).toBe(7);
      expect(result?.quizId).toBe(8);
    });
  });
});
