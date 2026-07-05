import { UserQuizAttempt } from "@/domain/entities/UserQuizAttempt";
import type { UserQuizAttemptStatus } from "@/domain/value-objects/DomainEnums";

describe("UserQuizAttempt", () => {
  describe("constructor", () => {
    it("should create instance with all properties", () => {
      const now = new Date();
      const instance = new UserQuizAttempt(
        "id1",
        "userId1",
        "quizId1",
        "Quiz Title",
        [{ id: "q1", answer: 0 }],
        85,
        "in_progress" as UserQuizAttemptStatus,
        now,
        null,
        now,
        now
      );

      expect(instance.id).toBe("id1");
      expect(instance.userId).toBe("userId1");
      expect(instance.quizId).toBe("quizId1");
      expect(instance.quizTitle).toBe("Quiz Title");
      expect(instance.answers).toEqual([{ id: "q1", answer: 0 }]);
      expect(instance.score).toBe(85);
      expect(instance.status).toBe("in_progress");
      expect(instance.completedAt).toBeNull();
    });

    it("should set completedAt when provided", () => {
      const now = new Date();
      const completed = new Date(now.getTime() + 3600000);
      const instance = new UserQuizAttempt(
        "id1",
        "userId1",
        "quizId1",
        "Quiz",
        [],
        90,
        "completed" as UserQuizAttemptStatus,
        now,
        completed,
        now,
        now
      );

      expect(instance.completedAt).toEqual(completed);
    });
  });

  describe("fromPrisma", () => {
    it("should return null for falsy input", () => {
      expect(UserQuizAttempt.fromPrisma(null)).toBeNull();
      expect(UserQuizAttempt.fromPrisma(undefined)).toBeNull();
      expect(UserQuizAttempt.fromPrisma(false)).toBeNull();
    });

    it("should create instance from Prisma object with all fields", () => {
      const now = new Date();
      const data = {
        id: "id1",
        userId: "userId1",
        quizId: "quizId1",
        quizTitle: "Quiz",
        answers: [{ q: 1 }],
        score: 75,
        status: "completed",
        startedAt: now,
        completedAt: new Date(now.getTime() + 1000),
        createdAt: now,
        updatedAt: now,
      };

      const instance = UserQuizAttempt.fromPrisma(data);

      expect(instance).not.toBeNull();
      expect(instance!.id).toBe("id1");
      expect(instance!.userId).toBe("userId1");
      expect(instance!.quizId).toBe("quizId1");
      expect(instance!.quizTitle).toBe("Quiz");
      expect(instance!.score).toBe(75);
      expect(instance!.status).toBe("completed");
    });

    it("should use defaults when fields are missing", () => {
      const instance = UserQuizAttempt.fromPrisma({});

      expect(instance).not.toBeNull();
      expect(instance!.id).toBe("");
      expect(instance!.userId).toBe("");
      expect(instance!.quizId).toBe("");
      expect(instance!.quizTitle).toBe("");
      expect(instance!.score).toBe(0);
      expect(instance!.status).toBe("pending");
      expect(instance!.answers).toBeUndefined();
      expect(instance!.completedAt).toBeNull();
    });

    it("should coerce string numbers to numbers", () => {
      const instance = UserQuizAttempt.fromPrisma({
        score: "95",
        id: 123,
      });

      expect(instance!.score).toBe(95);
      expect(typeof instance!.score).toBe("number");
      expect(instance!.id).toBe("123");
      expect(typeof instance!.id).toBe("string");
    });

    it("should parse date strings", () => {
      const dateStr = "2024-01-15T10:30:00Z";
      const instance = UserQuizAttempt.fromPrisma({
        startedAt: dateStr,
        createdAt: dateStr,
        updatedAt: dateStr,
      });

      expect(instance!.startedAt).toBeInstanceOf(Date);
      expect(instance!.createdAt).toBeInstanceOf(Date);
      expect(instance!.updatedAt).toBeInstanceOf(Date);
    });

    it("should handle null completedAt", () => {
      const instance = UserQuizAttempt.fromPrisma({
        completedAt: null,
      });

      expect(instance!.completedAt).toBeNull();
    });

    it("should parse completedAt when present", () => {
      const dateStr = "2024-01-15T10:30:00Z";
      const instance = UserQuizAttempt.fromPrisma({
        completedAt: dateStr,
      });

      expect(instance!.completedAt).toBeInstanceOf(Date);
      expect(instance!.completedAt).not.toBeNull();
    });

    it("should preserve answers object structure", () => {
      const answers = { q1: [0, 1], q2: [2] };
      const instance = UserQuizAttempt.fromPrisma({
        answers,
      });

      expect(instance!.answers).toEqual(answers);
    });
  });
});
