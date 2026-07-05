import { AdminQuizRepositoryAdapter } from "@/infrastructure/admin/AdminQuizRepositoryAdapter";
import * as adminQuizRepository from "@/server/admin/repositories/adminQuizRepository";
import { AdminQuiz } from "@/domain/entities/AdminQuiz";

jest.mock("@/server/admin/repositories/adminQuizRepository");

describe("AdminQuizRepositoryAdapter", () => {
  let adapter: AdminQuizRepositoryAdapter;

  beforeEach(() => {
    adapter = new AdminQuizRepositoryAdapter();
    jest.clearAllMocks();
  });

  describe("createApprovedQuiz", () => {
    it("should create approved MCQ quiz and return AdminQuiz", async () => {
      const mockPrismaData = {
        id: "quiz1",
        title: "Test Quiz",
        category: "Science",
        difficulty: "hard",
        quizType: "mcq",
        status: "approved",
        questions: [
          {
            id: "q1",
            question: "What is 2+2?",
            answer: "4",
            options: ["2", "4", "6", "8"],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (adminQuizRepository.createAdminQuiz as jest.Mock).mockResolvedValue(
        mockPrismaData
      );

      const result = await adapter.createApprovedQuiz({
        title: "Test Quiz",
        category: "Science",
        difficulty: "hard",
        quizType: "mcq",
        status: "approved",
        questions: [
          {
            question: "What is 2+2?",
            answer: "4",
            options: ["2", "4", "6", "8"],
          },
        ],
      });

      expect(result).toBeInstanceOf(AdminQuiz);
      expect(result.id).toBe("quiz1");
      expect(result.title).toBe("Test Quiz");
      expect(result.quizType).toBe("mcq");
      expect(adminQuizRepository.createAdminQuiz).toHaveBeenCalledWith({
        title: "Test Quiz",
        category: "Science",
        difficulty: "hard",
        quizType: "mcq",
        status: "approved",
        questions: expect.any(Array),
      });
    });

    it("should create open_ended quiz with citations", async () => {
      const mockPrismaData = {
        id: "quiz2",
        title: "Essay Quiz",
        category: "Literature",
        difficulty: "medium",
        quizType: "open_ended",
        status: "draft",
        questions: [
          {
            id: "q1",
            question: "Explain gravity",
            answer: "Gravity is...",
            citation: { source: "Physics 101", snippet: "Newton's law", confidence: 0.95 },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (adminQuizRepository.createAdminQuiz as jest.Mock).mockResolvedValue(
        mockPrismaData
      );

      const result = await adapter.createApprovedQuiz({
        title: "Essay Quiz",
        category: "Literature",
        difficulty: "medium",
        quizType: "open_ended",
        status: "draft",
        questions: [
          {
            question: "Explain gravity",
            answer: "Gravity is...",
            citation: { source: "Physics 101", snippet: "Newton's law", confidence: 0.95 },
          },
        ],
      });

      expect(result.quizType).toBe("open_ended");
      expect(result.status).toBe("draft");
    });
  });

  describe("findApprovedQuizzesWithAttempts", () => {
    it("should find all approved quizzes when no filter provided", async () => {
      const mockData = [
        {
          id: "q1",
          title: "Quiz 1",
          category: "Science",
          difficulty: "easy",
          quizType: "mcq",
          status: "approved",
          questions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "q2",
          title: "Quiz 2",
          category: "Math",
          difficulty: "hard",
          quizType: "open_ended",
          status: "approved",
          questions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (adminQuizRepository.findAdminQuizzes as jest.Mock).mockResolvedValue(mockData);

      const result = await adapter.findApprovedQuizzesWithAttempts();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(AdminQuiz);
      expect(result[1]).toBeInstanceOf(AdminQuiz);
      expect(adminQuizRepository.findAdminQuizzes).toHaveBeenCalledWith(undefined);
    });

    it("should find quizzes with category filter", async () => {
      const mockData = [
        {
          id: "q1",
          title: "Science Quiz",
          category: "Science",
          difficulty: "medium",
          quizType: "mcq",
          status: "approved",
          questions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (adminQuizRepository.findAdminQuizzes as jest.Mock).mockResolvedValue(mockData);

      const result = await adapter.findApprovedQuizzesWithAttempts({
        category: "Science",
      });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("Science");
      expect(adminQuizRepository.findAdminQuizzes).toHaveBeenCalledWith({
        category: "Science",
      });
    });

    it("should find quizzes with difficulty filter", async () => {
      const mockData = [
        {
          id: "q1",
          title: "Hard Quiz",
          category: "Science",
          difficulty: "hard",
          quizType: "mcq",
          status: "approved",
          questions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (adminQuizRepository.findAdminQuizzes as jest.Mock).mockResolvedValue(mockData);

      const result = await adapter.findApprovedQuizzesWithAttempts({
        difficulty: "hard",
      });

      expect(result).toHaveLength(1);
      expect(result[0].difficulty).toBe("hard");
    });

    it("should return empty array when no quizzes found", async () => {
      (adminQuizRepository.findAdminQuizzes as jest.Mock).mockResolvedValue(null);

      const result = await adapter.findApprovedQuizzesWithAttempts();

      expect(result).toEqual([]);
    });

    it("should filter out null AdminQuiz conversions", async () => {
      const mockData = [
        {
          id: "q1",
          title: "Quiz 1",
          category: "Science",
          difficulty: "easy",
          quizType: "mcq",
          status: "approved",
          questions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        null,
      ];

      (adminQuizRepository.findAdminQuizzes as jest.Mock).mockResolvedValue(mockData);

      const result = await adapter.findApprovedQuizzesWithAttempts();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("q1");
    });
  });

  describe("findApprovedQuizById", () => {
    it("should find quiz by ID", async () => {
      const mockData = {
        id: "q1",
        title: "Quiz 1",
        category: "Science",
        difficulty: "easy",
        quizType: "mcq",
        status: "approved",
        questions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (adminQuizRepository.findApprovedQuizById as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await adapter.findApprovedQuizById("q1");

      expect(result).toBeInstanceOf(AdminQuiz);
      expect(result!.id).toBe("q1");
      expect(adminQuizRepository.findApprovedQuizById).toHaveBeenCalledWith("q1");
    });

    it("should return null when quiz not found", async () => {
      (adminQuizRepository.findApprovedQuizById as jest.Mock).mockResolvedValue(
        null
      );

      const result = await adapter.findApprovedQuizById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("deleteQuizById", () => {
    it("should delete quiz by ID", async () => {
      (adminQuizRepository.deleteAdminQuizById as jest.Mock).mockResolvedValue(
        undefined
      );

      await adapter.deleteQuizById("q1");

      expect(adminQuizRepository.deleteAdminQuizById).toHaveBeenCalledWith("q1");
    });

    it("should handle deletion errors", async () => {
      (adminQuizRepository.deleteAdminQuizById as jest.Mock).mockRejectedValue(
        new Error("Delete failed")
      );

      await expect(adapter.deleteQuizById("q1")).rejects.toThrow("Delete failed");
    });
  });

  describe("findApprovedQuizzesForLibrary", () => {
    it("should find all approved quizzes for library", async () => {
      const mockData = [
        {
          id: "q1",
          title: "Library Quiz 1",
          category: "Science",
          difficulty: "easy",
          quizType: "mcq",
          status: "approved",
          questions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "q2",
          title: "Library Quiz 2",
          category: "Math",
          difficulty: "medium",
          quizType: "mcq",
          status: "approved",
          questions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (adminQuizRepository.findApprovedQuizzesForLibrary as jest.Mock).mockResolvedValue(
        mockData
      );

      const result = await adapter.findApprovedQuizzesForLibrary();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(AdminQuiz);
      expect(adminQuizRepository.findApprovedQuizzesForLibrary).toHaveBeenCalled();
    });

    it("should return empty array when no quizzes available", async () => {
      (adminQuizRepository.findApprovedQuizzesForLibrary as jest.Mock).mockResolvedValue(
        null
      );

      const result = await adapter.findApprovedQuizzesForLibrary();

      expect(result).toEqual([]);
    });
  });

  describe("findAllUserQuizAttempts", () => {
    it("should find all user quiz attempts", async () => {
      const mockAttempts = [
        {
          id: "a1",
          userId: "u1",
          quizId: "q1",
          score: 85,
          status: "completed",
        },
        {
          id: "a2",
          userId: "u2",
          quizId: "q2",
          score: 90,
          status: "completed",
        },
      ];

      (adminQuizRepository.findAllUserQuizAttempts as jest.Mock).mockResolvedValue(
        mockAttempts
      );

      const result = await adapter.findAllUserQuizAttempts();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("a1");
      expect(adminQuizRepository.findAllUserQuizAttempts).toHaveBeenCalled();
    });

    it("should return empty array when no attempts found", async () => {
      (adminQuizRepository.findAllUserQuizAttempts as jest.Mock).mockResolvedValue([]);

      const result = await adapter.findAllUserQuizAttempts();

      expect(result).toEqual([]);
    });
  });
});
