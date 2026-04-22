import {
  createAdminQuiz,
  deleteAdminQuizById,
  findAdminQuizzes,
  findAllUserQuizAttempts,
  findApprovedQuizById,
} from "@/server/admin/repositories/adminQuizRepository";
import { prisma } from "@/server/core/db";

jest.setTimeout(30000);

describe("adminQuizRepository", () => {
  let createdQuizId = "";

  beforeAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { quizId: "admin-repo-attempt" } });
    await prisma.adminQuizQuestion.deleteMany({ where: { quiz: { title: { startsWith: "repo-admin-quiz" } } } });
    await prisma.adminQuiz.deleteMany({ where: { title: { startsWith: "repo-admin-quiz" } } });
  });

  afterAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { quizId: "admin-repo-attempt" } });
    await prisma.adminQuizQuestion.deleteMany({ where: { quiz: { title: { startsWith: "repo-admin-quiz" } } } });
    await prisma.adminQuiz.deleteMany({ where: { title: { startsWith: "repo-admin-quiz" } } });
    await prisma.$disconnect();
  });

  it("creates admin quiz with nested questions", async () => {
    const created = await createAdminQuiz({
      title: "repo-admin-quiz-1",
      category: "math",
      difficulty: "easy",
      status: "approved",
      questions: [{ question: "Q1", answer: "A1" }],
    });

    createdQuizId = created.id;
    expect(created.title).toBe("repo-admin-quiz-1");
    expect(created.questions.length).toBe(1);
  });

  it("finds admin quizzes with filter", async () => {
    const quizzes = await findAdminQuizzes({ category: "math", difficulty: "easy" });
    expect(quizzes.some((quiz) => quiz.id === createdQuizId)).toBe(true);
  });

  it("deletes admin quiz by id", async () => {
    const extraQuiz = await createAdminQuiz({
      title: "repo-admin-quiz-delete",
      category: "math",
      difficulty: "easy",
      questions: [{ question: "QD", answer: "AD" }],
    });

    await deleteAdminQuizById(extraQuiz.id);
    const deleted = await prisma.adminQuiz.findUnique({ where: { id: extraQuiz.id } });
    expect(deleted).toBeNull();
  });

  it("finds approved quiz by id", async () => {
    const approved = await findApprovedQuizById(createdQuizId);
    expect(approved?.id).toBe(createdQuizId);
    expect(approved?.status).toBe("approved");
  });

  it("lists all user quiz attempts", async () => {
    await prisma.userQuizAttempt.create({
      data: {
        userId: "repo-user-1",
        quizId: "admin-repo-attempt",
        quizTitle: "repo-admin-quiz-attempt",
        answers: [],
        score: 77,
        status: "completed",
        completedAt: new Date(),
      },
    });

    const attempts = await findAllUserQuizAttempts();
    expect(attempts.some((attempt) => attempt.quizId === "admin-repo-attempt")).toBe(true);
  });
});