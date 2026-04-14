import {
  AdminQuizNotFoundError,
  submitAndGradeAdminQuizAttempt,
} from "@/server/admin/services/adminQuizAttemptService";
import { createApprovedAdminQuiz } from "@/server/admin/services/adminQuizService";
import { prisma } from "@/server/core/db";

jest.setTimeout(30000);

describe("adminQuizAttemptService", () => {
  beforeAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { quizTitle: { startsWith: "attempt-service-quiz" } } });
    await prisma.adminQuizQuestion.deleteMany({ where: { quiz: { title: { startsWith: "attempt-service-quiz" } } } });
    await prisma.adminQuiz.deleteMany({ where: { title: { startsWith: "attempt-service-quiz" } } });
  });

  afterAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { quizTitle: { startsWith: "attempt-service-quiz" } } });
    await prisma.adminQuizQuestion.deleteMany({ where: { quiz: { title: { startsWith: "attempt-service-quiz" } } } });
    await prisma.adminQuiz.deleteMany({ where: { title: { startsWith: "attempt-service-quiz" } } });
    await prisma.$disconnect();
  });

  it("throws when quiz is missing", async () => {
    await expect(
      submitAndGradeAdminQuizAttempt({
        quizId: "missing",
        userId: "u1",
        answers: ["a"],
      }),
    ).rejects.toBeInstanceOf(AdminQuizNotFoundError);
  });

  it("grades MCQ answers with exact matching", async () => {
    const quiz = await createApprovedAdminQuiz({
      title: "attempt-service-quiz-mcq",
      category: "history",
      difficulty: "easy",
      quizType: "mcq",
      questions: [
        {
          question: "Is Earth a planet?",
          answer: "yes",
          options: ["yes", "no", "maybe"],
        },
        {
          question: "Is water wet?",
          answer: "yes",
          options: ["yes", "no", "sometimes"],
        },
      ],
    });

    const result = await submitAndGradeAdminQuizAttempt({
      quizId: quiz.id,
      userId: "u1",
      answers: ["yes", "wrong"],
    });

    expect(result.score).toBe(50);

    const acceptedCount = result.questionResults.filter((item) => item.isAccepted).length;
    expect(acceptedCount).toBe(1);
    expect(result.questionResults.every((item) => item.gradingMethod === "exact_match")).toBe(true);

    const attempts = await prisma.userQuizAttempt.findMany({ where: { quizId: quiz.id } });
    expect(attempts.length).toBe(1);
    expect(attempts[0].score).toBe(50);
  });

  it("grades open-ended answers with typo tolerance", async () => {
    const quiz = await createApprovedAdminQuiz({
      title: "attempt-service-quiz-open",
      category: "programming",
      difficulty: "easy",
      quizType: "open_ended",
      questions: [
        { question: "Keyword", answer: "return" },
        { question: "Flow control", answer: "return" },
        { question: "Output", answer: "return" },
      ],
    });

    const result = await submitAndGradeAdminQuizAttempt({
      quizId: quiz.id,
      userId: "u2",
      answers: ["retrun", "", "return"],
    });

    expect(result.score).toBe(66.67);

    const acceptedCount = result.questionResults.filter((item) => item.isAccepted).length;
    expect(acceptedCount).toBe(2);

    expect(
      result.questionResults.some(
        (item) =>
          item.gradingMethod === "exact_match" &&
          item.isAccepted &&
          item.percentageSimilar === 100,
      ),
    ).toBe(true);
    expect(
      result.questionResults.some(
        (item) =>
          item.gradingMethod === "typo_tolerant" &&
          item.isAccepted &&
          item.percentageSimilar === 100,
      ),
    ).toBe(true);
    expect(
      result.questionResults.some(
        (item) =>
          item.gradingMethod === "typo_tolerant" &&
          !item.isAccepted &&
          item.percentageSimilar === 0,
      ),
    ).toBe(true);
  });

  it("treats non-array answers input as empty submissions", async () => {
    const quiz = await createApprovedAdminQuiz({
      title: "attempt-service-quiz-open-2",
      category: "programming",
      difficulty: "easy",
      quizType: "open_ended",
      questions: [{ question: "Q", answer: "answer" }],
    });

    const result = await submitAndGradeAdminQuizAttempt({
      quizId: quiz.id,
      userId: "u3",
      answers: undefined as unknown as string[],
    });

    expect(result.questionResults[0]).toEqual(
      expect.objectContaining({
        userAnswer: "",
        gradingMethod: "typo_tolerant",
        percentageSimilar: 0,
      }),
    );
  });

  it("returns zero score for quizzes without questions", async () => {
    const quiz = await prisma.adminQuiz.create({
      data: {
        title: "attempt-service-quiz-empty",
        category: "misc",
        difficulty: "easy",
        quizType: "open_ended",
        status: "approved",
      },
    });

    const result = await submitAndGradeAdminQuizAttempt({
      quizId: quiz.id,
      userId: "u4",
      answers: ["anything"],
    });

    expect(result.score).toBe(0);
    expect(result.questionResults).toEqual([]);

    const attempts = await prisma.userQuizAttempt.findMany({ where: { quizId: quiz.id } });
    expect(attempts.length).toBe(1);
    expect(attempts[0].score).toBe(0);
  });
});
