jest.mock("@/server/core/db", () => ({
  prisma: {
    adminQuiz: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    userQuizAttempt: {
      findMany: jest.fn(),
    },
  },
}));

import {
  createAdminQuiz,
  deleteAdminQuizById,
  findAdminQuizzes,
  findAllUserQuizAttempts,
  findApprovedQuizById,
} from "@/server/repositories/adminQuizRepository";
import { prisma } from "@/server/core/db";

describe("adminQuizRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates admin quiz with nested questions", async () => {
    await createAdminQuiz({
      title: "Quiz 1",
      category: "math",
      difficulty: "easy",
      questions: [{ question: "Q1", answer: "A1" }],
    });

    expect(prisma.adminQuiz.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Quiz 1",
          questions: { create: [{ question: "Q1", answer: "A1" }] },
        }),
      }),
    );
  });

  it("finds admin quizzes with filter", async () => {
    await findAdminQuizzes({ category: "math", difficulty: "easy" });
    expect(prisma.adminQuiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: "math", difficulty: "easy" } }),
    );
  });

  it("deletes admin quiz by id", async () => {
    await deleteAdminQuizById("quiz-1");
    expect(prisma.adminQuiz.delete).toHaveBeenCalledWith({ where: { id: "quiz-1" } });
  });

  it("finds approved quiz by id", async () => {
    await findApprovedQuizById("quiz-1");
    expect(prisma.adminQuiz.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "quiz-1", status: "approved" },
      }),
    );
  });

  it("lists all user quiz attempts", async () => {
    await findAllUserQuizAttempts();
    expect(prisma.userQuizAttempt.findMany).toHaveBeenCalled();
  });
});