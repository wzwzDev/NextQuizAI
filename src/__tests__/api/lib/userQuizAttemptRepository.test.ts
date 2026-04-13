jest.mock("@/lib/db", () => ({
  prisma: {
    userQuizAttempt: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import {
  createUserQuizAttempt,
  listUserQuizAttemptsByUserId,
} from "@/lib/repositories/userQuizAttemptRepository";
import { prisma } from "@/lib/db";

describe("userQuizAttemptRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates user quiz attempt", async () => {
    await createUserQuizAttempt({
      userId: "u1",
      quizId: "q1",
      quizTitle: "Quiz 1",
      answers: [{ question: "Q", answer: "A" }],
      score: 90,
    });

    expect(prisma.userQuizAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          quizId: "q1",
          quizTitle: "Quiz 1",
          score: 90,
        }),
      }),
    );
  });

  it("lists quiz attempts by user", async () => {
    await listUserQuizAttemptsByUserId("u1");
    expect(prisma.userQuizAttempt.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
  });
});