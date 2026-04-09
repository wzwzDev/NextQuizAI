import {
  createApprovedAdminQuiz,
  getAdminQuizzes,
  getApprovedQuiz,
  getQuizStatisticsSummary,
  removeAdminQuiz,
} from "@/server/services/adminQuizService";
import {
  createAdminQuiz,
  deleteAdminQuizById,
  findAdminQuizzes,
  findAllUserQuizAttempts,
  findApprovedQuizById,
} from "@/server/repositories/adminQuizRepository";

jest.mock("@/server/repositories/adminQuizRepository", () => ({
  createAdminQuiz: jest.fn(),
  deleteAdminQuizById: jest.fn(),
  findAdminQuizzes: jest.fn(),
  findAllUserQuizAttempts: jest.fn(),
  findApprovedQuizById: jest.fn(),
}));

describe("adminQuizService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses fileName as title fallback when title is blank", async () => {
    (createAdminQuiz as jest.Mock).mockResolvedValue({ id: "quiz-1" });

    await createApprovedAdminQuiz({
      title: "   ",
      fileName: "chapter-1.pdf",
      category: "science",
      difficulty: "easy",
      questions: [{ question: "Q1", answer: "A1" }],
    });

    expect(createAdminQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "chapter-1",
        status: "approved",
      }),
    );
  });

  it("uses default title when no title and no filename", async () => {
    (createAdminQuiz as jest.Mock).mockResolvedValue({ id: "quiz-1" });

    await createApprovedAdminQuiz({
      category: "science",
      difficulty: "easy",
      questions: [{ question: "Q1", answer: "A1" }],
    });

    expect(createAdminQuiz).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Untitled Quiz" }),
    );
  });

  it("delegates quiz listing", async () => {
    (findAdminQuizzes as jest.Mock).mockResolvedValue([]);
    await getAdminQuizzes({ category: "math" });
    expect(findAdminQuizzes).toHaveBeenCalledWith({ category: "math" });
  });

  it("delegates approved quiz fetch", async () => {
    (findApprovedQuizById as jest.Mock).mockResolvedValue({ id: "quiz-1" });
    await getApprovedQuiz("quiz-1");
    expect(findApprovedQuizById).toHaveBeenCalledWith("quiz-1");
  });

  it("delegates quiz deletion", async () => {
    (deleteAdminQuizById as jest.Mock).mockResolvedValue({ id: "quiz-1" });
    await removeAdminQuiz("quiz-1");
    expect(deleteAdminQuizById).toHaveBeenCalledWith("quiz-1");
  });

  it("builds quiz statistics summary by quiz title", async () => {
    (findAllUserQuizAttempts as jest.Mock).mockResolvedValue([
      { quizId: "q1", quizTitle: "Quiz A", score: 80 },
      { quizId: "q1", quizTitle: "Quiz A", score: 60 },
      { quizId: "q2", quizTitle: "Quiz B", score: 90 },
    ]);

    const summary = await getQuizStatisticsSummary();

    expect(summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          quizId: "q1",
          quizTitle: "Quiz A",
          attempts: 2,
          averageScore: 70,
          completionRate: 100,
        }),
        expect.objectContaining({
          quizId: "q2",
          quizTitle: "Quiz B",
          attempts: 1,
          averageScore: 90,
          completionRate: 100,
        }),
      ]),
    );
  });
});