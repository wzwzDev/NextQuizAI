import {
  createUserQuizAttempt,
  listUserQuizAttemptsByUserId,
} from "@/server/repositories/userQuizAttemptRepository";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
import { cleanupUsersByEmail, createTestUser, uniqueEmail } from "../../utils/prismaUsers";

jest.setTimeout(30000);

describe("userQuizAttemptRepository", () => {
  let user: User;
  const userEmail = uniqueEmail("repo-attempt-user");

  beforeAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { quizId: "repo-quiz-1" } });
    await cleanupUsersByEmail(prisma, [userEmail]);

    user = await createTestUser(prisma, { email: userEmail });
  });

  afterAll(async () => {
    await prisma.userQuizAttempt.deleteMany({ where: { userId: user.id } });
    await cleanupUsersByEmail(prisma, [userEmail]);
    await prisma.$disconnect();
  });

  it("creates user quiz attempt", async () => {
    const created = await createUserQuizAttempt({
      userId: user.id,
      quizId: "repo-quiz-1",
      quizTitle: "Repo Quiz 1",
      answers: [{ question: "Q", answer: "A" }],
      score: 90,
    });

    expect(created.userId).toBe(user.id);
    expect(created.quizId).toBe("repo-quiz-1");
    expect(created.score).toBe(90);
  });

  it("lists quiz attempts by user", async () => {
    const attempts = await listUserQuizAttemptsByUserId(user.id);
    expect(attempts.length).toBeGreaterThan(0);
    expect(attempts.every((attempt) => attempt.userId === user.id)).toBe(true);
  });
});