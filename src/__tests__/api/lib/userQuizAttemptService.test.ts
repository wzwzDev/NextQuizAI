import {
  getUserQuizStats,
  saveUserQuizAttempt,
} from "@/server/services/userQuizAttemptService";
import {
  createUserQuizAttempt,
  listUserQuizAttemptsByUserId,
} from "@/server/repositories/userQuizAttemptRepository";

jest.mock("@/server/repositories/userQuizAttemptRepository", () => ({
  createUserQuizAttempt: jest.fn(),
  listUserQuizAttemptsByUserId: jest.fn(),
}));

describe("userQuizAttemptService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates attempt creation", async () => {
    await saveUserQuizAttempt({
      userId: "u1",
      quizId: "q1",
      quizTitle: "Quiz 1",
      answers: [{ question: "Q", answer: "A" }],
      score: 90,
    });

    expect(createUserQuizAttempt).toHaveBeenCalledWith({
      userId: "u1",
      quizId: "q1",
      quizTitle: "Quiz 1",
      answers: [{ question: "Q", answer: "A" }],
      score: 90,
    });
  });

  it("aggregates attempts by quiz", async () => {
    (listUserQuizAttemptsByUserId as jest.Mock).mockResolvedValue([
      {
        quizId: "q1",
        quizTitle: "Quiz 1",
        score: 80,
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
      },
      {
        quizId: "q1",
        quizTitle: "Quiz 1",
        score: 100,
        createdAt: new Date("2026-01-02T10:00:00.000Z"),
      },
      {
        quizId: "q2",
        quizTitle: "Quiz 2",
        score: 60,
        createdAt: new Date("2026-01-03T10:00:00.000Z"),
      },
    ]);

    const stats = await getUserQuizStats("u1");

    expect(stats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "q1",
          title: "Quiz 1",
          attempts: 2,
          averageScore: 90,
        }),
        expect.objectContaining({
          id: "q2",
          title: "Quiz 2",
          attempts: 1,
          averageScore: 60,
        }),
      ]),
    );
  });
});