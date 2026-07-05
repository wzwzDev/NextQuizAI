import { QuizAttemptRepositoryAdapter } from "@/infrastructure/quiz/QuizAttemptRepositoryAdapter";
import * as userQuizAttemptRepository from "@/server/repositories/userQuizAttemptRepository";
import { UserQuizAttempt } from "@/domain/entities/UserQuizAttempt";

jest.mock("@/server/repositories/userQuizAttemptRepository");

describe("QuizAttemptRepositoryAdapter", () => {
  let adapter: QuizAttemptRepositoryAdapter;
  const mockDate = new Date("2024-01-15T10:00:00Z");

  beforeEach(() => {
    adapter = new QuizAttemptRepositoryAdapter();
    jest.clearAllMocks();
  });

  describe("ensurePending", () => {
    it("should ensure pending attempt and return UserQuizAttempt", async () => {
      const mockPrismaData = {
        id: "attempt1",
        userId: "user1",
        quizId: "quiz1",
        quizTitle: "Test Quiz",
        answers: null,
        score: 0,
        status: "pending",
        startedAt: mockDate,
        completedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (userQuizAttemptRepository.ensurePendingUserQuizAttempt as jest.Mock)
        .mockResolvedValue(mockPrismaData);

      const result = await adapter.ensurePending({
        userId: "user1",
        quizId: "quiz1",
        quizTitle: "Test Quiz",
      });

      expect(result).toBeInstanceOf(UserQuizAttempt);
      expect(result!.id).toBe("attempt1");
      expect(result!.status).toBe("pending");
      expect(userQuizAttemptRepository.ensurePendingUserQuizAttempt).toHaveBeenCalledWith({
        userId: "user1",
        quizId: "quiz1",
        quizTitle: "Test Quiz",
      });
    });

    it("should handle null return from repository", async () => {
      (userQuizAttemptRepository.ensurePendingUserQuizAttempt as jest.Mock)
        .mockResolvedValue(null);

      const result = await adapter.ensurePending({
        userId: "user1",
        quizId: "quiz1",
        quizTitle: "Test Quiz",
      });

      expect(result).toBeNull();
    });
  });

  describe("findAttemptByUserAndQuiz", () => {
    it("should find attempt and return UserQuizAttempt", async () => {
      const mockPrismaData = {
        id: "attempt2",
        userId: "user1",
        quizId: "quiz1",
        quizTitle: "Test Quiz",
        answers: [{ q1: 0 }],
        score: 85,
        status: "completed",
        startedAt: mockDate,
        completedAt: mockDate,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      (userQuizAttemptRepository.findUserQuizAttemptByUserAndQuiz as jest.Mock)
        .mockResolvedValue(mockPrismaData);

      const result = await adapter.findAttemptByUserAndQuiz("user1", "quiz1");

      expect(result).toBeInstanceOf(UserQuizAttempt);
      expect(result!.id).toBe("attempt2");
      expect(result!.score).toBe(85);
      expect(result!.status).toBe("completed");
      expect(userQuizAttemptRepository.findUserQuizAttemptByUserAndQuiz).toHaveBeenCalledWith(
        "user1",
        "quiz1"
      );
    });

    it("should return null if attempt not found", async () => {
      (userQuizAttemptRepository.findUserQuizAttemptByUserAndQuiz as jest.Mock)
        .mockResolvedValue(null);

      const result = await adapter.findAttemptByUserAndQuiz("user1", "quiz1");

      expect(result).toBeNull();
    });
  });

  describe("completeAttempt", () => {
    it("should complete attempt with answers and score", async () => {
      const input = {
        userId: "user1",
        quizId: "quiz1",
        answers: [{ q1: 1 }, { q2: 2 }],
        score: 75,
      };

      (userQuizAttemptRepository.completePendingUserQuizAttempt as jest.Mock)
        .mockResolvedValue(undefined);

      await adapter.completeAttempt(input);

      expect(userQuizAttemptRepository.completePendingUserQuizAttempt).toHaveBeenCalledWith(input);
    });

    it("should handle empty answers array", async () => {
      const input = {
        userId: "user1",
        quizId: "quiz1",
        answers: [],
        score: 0,
      };

      (userQuizAttemptRepository.completePendingUserQuizAttempt as jest.Mock)
        .mockResolvedValue(undefined);

      await adapter.completeAttempt(input);

      expect(userQuizAttemptRepository.completePendingUserQuizAttempt).toHaveBeenCalledWith(input);
    });
  });

  describe("complete", () => {
    it("should complete attempt with details (legacy method)", async () => {
      const input = {
        userId: "user1",
        quizId: "quiz1",
        score: 90,
        details: { answers: [{ q1: 0 }], time: 600 },
      };

      (userQuizAttemptRepository.completePendingUserQuizAttempt as jest.Mock)
        .mockResolvedValue(undefined);

      await adapter.complete(input);

      expect(userQuizAttemptRepository.completePendingUserQuizAttempt).toHaveBeenCalledWith({
        userId: "user1",
        quizId: "quiz1",
        answers: input.details,
        score: 90,
      });
    });

    it("should pass null details correctly", async () => {
      const input = {
        userId: "user1",
        quizId: "quiz1",
        score: 100,
        details: null,
      };

      (userQuizAttemptRepository.completePendingUserQuizAttempt as jest.Mock)
        .mockResolvedValue(undefined);

      await adapter.complete(input);

      expect(userQuizAttemptRepository.completePendingUserQuizAttempt).toHaveBeenCalledWith({
        userId: "user1",
        quizId: "quiz1",
        answers: null,
        score: 100,
      });
    });
  });
});
