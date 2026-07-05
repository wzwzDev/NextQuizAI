import { QuizQuestion } from "@/domain/entities/QuizQuestion";

describe("QuizQuestion Entity", () => {
  describe("constructor", () => {
    it("should create instance with provided values", () => {
      const question = new QuizQuestion(1, 2, "What is 2+2?", "4");

      expect(question.id).toBe(1);
      expect(question.quizId).toBe(2);
      expect(question.text).toBe("What is 2+2?");
      expect(question.answer).toBe("4");
    });

    it("should handle string numbers", () => {
      const question = new QuizQuestion(
        "123" as any,
        "456" as any,
        "Question",
        "Answer"
      );

      expect(question.id).toEqual("123" as any);
      expect(question.quizId).toEqual("456" as any);
    });
  });

  describe("fromPrisma", () => {
    it("should return null for null input", () => {
      const result = QuizQuestion.fromPrisma(null);

      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = QuizQuestion.fromPrisma(undefined);

      expect(result).toBeNull();
    });

    it("should create instance from valid Prisma data", () => {
      const prismaData = {
        id: 1,
        quizId: 2,
        text: "What is 2+2?",
        answer: "4",
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.quizId).toBe(2);
      expect(result?.text).toBe("What is 2+2?");
      expect(result?.answer).toBe("4");
    });

    it("should use default values for missing fields", () => {
      const prismaData = {};

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(0);
      expect(result?.quizId).toBe(0);
      expect(result?.text).toBe("");
      expect(result?.answer).toBe("");
    });

    it("should coerce values to correct types", () => {
      const prismaData = {
        id: "123",
        quizId: "456",
        text: 789,
        answer: true,
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(123);
      expect(result?.quizId).toBe(456);
      expect(result?.text).toBe("789");
      expect(result?.answer).toBe("true");
    });

    it("should handle partial Prisma data with some null fields", () => {
      const prismaData = {
        id: 10,
        quizId: null,
        text: "Question text",
        answer: null,
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(10);
      expect(result?.quizId).toBe(0);
      expect(result?.text).toBe("Question text");
      expect(result?.answer).toBe("");
    });

    it("should handle object with extra fields", () => {
      const prismaData = {
        id: 5,
        quizId: 10,
        text: "Test question",
        answer: "Test answer",
        extraField: "should be ignored",
        anotherField: 123,
      };

      const result = QuizQuestion.fromPrisma(prismaData);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(5);
      expect(result?.quizId).toBe(10);
      expect(result?.text).toBe("Test question");
      expect(result?.answer).toBe("Test answer");
    });
  });
});
