import {
  createApprovedAdminQuiz,
  getAdminQuizzes,
  getApprovedQuiz,
  getQuizStatisticsSummary,
  removeAdminQuiz,
} from "@/server/admin/services/adminQuizService";
import { prisma } from "@/server/core/db";

jest.setTimeout(30000);

describe("adminQuizService", () => {
  beforeAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { quizTitle: { startsWith: "service-admin-quiz" } } });
    await prisma.adminQuizQuestion.deleteMany({ where: { quiz: { title: { startsWith: "service-admin-quiz" } } } });
    await prisma.adminQuiz.deleteMany({ where: { title: { startsWith: "service-admin-quiz" } } });
  });

  afterAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { quizTitle: { startsWith: "service-admin-quiz" } } });
    await prisma.adminQuizQuestion.deleteMany({ where: { quiz: { title: { startsWith: "service-admin-quiz" } } } });
    await prisma.adminQuiz.deleteMany({ where: { title: { startsWith: "service-admin-quiz" } } });
    await prisma.$disconnect();
  });

  it("uses fileName as title fallback when title is blank", async () => {
    const quiz = await createApprovedAdminQuiz({
      title: "   ",
      fileName: "chapter-1.pdf",
      category: "science",
      difficulty: "easy",
      questions: [{ question: "Q1", answer: "A1" }],
    });

    expect(quiz.title).toBe("chapter-1");
    expect(quiz.status).toBe("approved");
  });

  it("uses default title when no title and no filename", async () => {
    const quiz = await createApprovedAdminQuiz({
      category: "science",
      difficulty: "easy",
      questions: [{ question: "Q1", answer: "A1" }],
    });

    expect(quiz.title).toBe("Untitled Quiz");
  });

  it("normalizes MCQ options and keeps the answer included once", async () => {
    const quiz = await createApprovedAdminQuiz({
      title: "service-admin-quiz-mcq",
      category: "science",
      difficulty: "medium",
      quizType: "mcq",
      questions: [
        {
          question: "What is the answer?",
          answer: "Correct",
          options: ["Wrong 1, Wrong 2", "Correct", "Wrong 3", "Wrong 1"],
        },
      ],
    });

    expect(quiz.questions[0].options).toEqual(
      expect.arrayContaining(["Correct", "Wrong 1", "Wrong 2", "Wrong 3"]),
    );
    expect(new Set(quiz.questions[0].options).size).toBe(4);
  });

  it("rejects MCQ quizzes with too few choices", async () => {
    await expect(
      createApprovedAdminQuiz({
        title: "service-admin-quiz-mcq-invalid",
        category: "science",
        difficulty: "medium",
        quizType: "mcq",
        questions: [
          {
            question: "What is the answer?",
            answer: "Correct",
            options: [],
          },
        ],
      }),
    ).rejects.toThrow("must contain at least 2 choices for MCQ");
  });

  it("delegates quiz listing", async () => {
    await createApprovedAdminQuiz({
      title: "service-admin-quiz-list",
      category: "math",
      difficulty: "easy",
      questions: [{ question: "Q", answer: "A" }],
    });

    const quizzes = await getAdminQuizzes({ category: "math" });
    expect(quizzes.some((quiz) => quiz.title === "service-admin-quiz-list")).toBe(true);
  });

  it("delegates approved quiz fetch", async () => {
    const quiz = await createApprovedAdminQuiz({
      title: "service-admin-quiz-approved",
      category: "math",
      difficulty: "easy",
      questions: [{ question: "Q", answer: "A" }],
    });

    const approved = await getApprovedQuiz(quiz.id);
    expect(approved?.id).toBe(quiz.id);
  });

  it("delegates quiz deletion", async () => {
    const quiz = await createApprovedAdminQuiz({
      title: "service-admin-quiz-delete",
      category: "math",
      difficulty: "easy",
      questions: [{ question: "Q", answer: "A" }],
    });

    await removeAdminQuiz(quiz.id);
    const removed = await prisma.adminQuiz.findUnique({ where: { id: quiz.id } });
    expect(removed).toBeNull();
  });

  it("builds quiz statistics summary by quiz title", async () => {
    const suffix = Date.now();
    const statsQuizIdOne = `service-admin-stats-q1-${suffix}`;
    const statsQuizIdTwo = `service-admin-stats-q2-${suffix}`;
    const statsQuizTitleOne = `service-admin-quiz-a-${suffix}`;
    const statsQuizTitleTwo = `service-admin-quiz-b-${suffix}`;

    await prisma.userQuizAttempt.createMany({
      data: [
        {
          quizId: statsQuizIdOne,
          quizTitle: statsQuizTitleOne,
          score: 80,
          userId: "u1",
          answers: [],
          status: "completed",
          completedAt: new Date(),
        },
        {
          quizId: statsQuizIdOne,
          quizTitle: statsQuizTitleOne,
          score: 60,
          userId: "u2",
          answers: [],
          status: "completed",
          completedAt: new Date(),
        },
        {
          quizId: statsQuizIdTwo,
          quizTitle: statsQuizTitleTwo,
          score: 90,
          userId: "u3",
          answers: [],
          status: "completed",
          completedAt: new Date(),
        },
      ],
    });

    const summary = await getQuizStatisticsSummary();

    expect(summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          quizId: statsQuizIdOne,
          quizTitle: statsQuizTitleOne,
          attempts: 2,
          averageScore: 70,
          completionRate: 100,
        }),
        expect.objectContaining({
          quizId: statsQuizIdTwo,
          quizTitle: statsQuizTitleTwo,
          attempts: 1,
          averageScore: 90,
          completionRate: 100,
        }),
      ]),
    );
  });

  it("counts pending attempts in quiz statistics summary", async () => {
    const suffix = Date.now();
    const statsQuizId = `service-admin-stats-pending-${suffix}`;
    const statsQuizTitle = `service-admin-quiz-pending-${suffix}`;

    await prisma.userQuizAttempt.createMany({
      data: [
        {
          quizId: statsQuizId,
          quizTitle: statsQuizTitle,
          score: 50,
          userId: "u4",
          answers: [],
          status: "pending",
        },
        {
          quizId: statsQuizId,
          quizTitle: statsQuizTitle,
          score: 100,
          userId: "u5",
          answers: [],
          status: "completed",
          completedAt: new Date(),
        },
      ],
    });

    const summary = await getQuizStatisticsSummary();
    const entry = summary.find((item) => item.quizId === statsQuizId);

    expect(entry).toEqual(
      expect.objectContaining({
        quizTitle: statsQuizTitle,
        attempts: 1,
        averageScore: 100,
        completionRate: 50,
      }),
    );
  });
});