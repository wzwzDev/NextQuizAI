import {
  AdminQuizNotFoundError,
  submitAndGradeAdminQuizAttempt,
} from "@/server/services/adminQuizAttemptService";
import { getApprovedQuiz } from "@/server/services/adminQuizService";
import { saveUserQuizAttempt } from "@/server/services/userQuizAttemptService";

jest.mock("@/server/services/adminQuizService", () => ({
  getApprovedQuiz: jest.fn(),
}));

jest.mock("@/server/services/userQuizAttemptService", () => ({
  saveUserQuizAttempt: jest.fn(),
}));

describe("adminQuizAttemptService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when quiz is missing", async () => {
    (getApprovedQuiz as jest.Mock).mockResolvedValue(null);

    await expect(
      submitAndGradeAdminQuizAttempt({
        quizId: "missing",
        userId: "u1",
        answers: ["a"],
      }),
    ).rejects.toBeInstanceOf(AdminQuizNotFoundError);

    expect(saveUserQuizAttempt).not.toHaveBeenCalled();
  });

  it("grades MCQ answers with exact matching", async () => {
    (getApprovedQuiz as jest.Mock).mockResolvedValue({
      id: "quiz-mcq",
      title: "MCQ Quiz",
      quizType: "mcq",
      questions: [
        { question: "Capital of France?", answer: "Paris" },
        { question: "2 + 2?", answer: "4" },
      ],
    });

    const result = await submitAndGradeAdminQuizAttempt({
      quizId: "quiz-mcq",
      userId: "u1",
      answers: ["paris", "5"],
    });

    expect(result.score).toBe(50);
    expect(result.questionResults).toEqual([
      expect.objectContaining({
        gradingMethod: "exact_match",
        isAccepted: true,
        percentageSimilar: 100,
      }),
      expect.objectContaining({
        gradingMethod: "exact_match",
        isAccepted: false,
        percentageSimilar: 0,
      }),
    ]);

    expect(saveUserQuizAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        quizId: "quiz-mcq",
        quizTitle: "MCQ Quiz",
        score: 50,
        answers: expect.objectContaining({
          submittedAnswers: ["paris", "5"],
          questionResults: expect.any(Array),
        }),
      }),
    );
  });

  it("grades open-ended answers with typo tolerance", async () => {
    (getApprovedQuiz as jest.Mock).mockResolvedValue({
      id: "quiz-open",
      title: "Open Quiz",
      quizType: "open_ended",
      questions: [
        { question: "Keyword", answer: "return" },
        { question: "Language", answer: "python" },
        { question: "Empty", answer: "" },
      ],
    });

    const result = await submitAndGradeAdminQuizAttempt({
      quizId: "quiz-open",
      userId: "u2",
      answers: ["retrun", "", ""],
    });

    expect(result.score).toBe(66.67);
    expect(result.questionResults[0]).toEqual(
      expect.objectContaining({
        gradingMethod: "typo_tolerant",
        isAccepted: true,
        percentageSimilar: 100,
      }),
    );
    expect(result.questionResults[1]).toEqual(
      expect.objectContaining({
        gradingMethod: "typo_tolerant",
        isAccepted: false,
        percentageSimilar: 0,
      }),
    );
    expect(result.questionResults[2]).toEqual(
      expect.objectContaining({
        gradingMethod: "exact_match",
        isAccepted: true,
        percentageSimilar: 100,
      }),
    );
  });

  it("treats non-array answers input as empty submissions", async () => {
    (getApprovedQuiz as jest.Mock).mockResolvedValue({
      id: "quiz-open-2",
      title: "Open Quiz 2",
      quizType: "open_ended",
      questions: [{ question: "Q", answer: "answer" }],
    });

    const result = await submitAndGradeAdminQuizAttempt({
      quizId: "quiz-open-2",
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
    (getApprovedQuiz as jest.Mock).mockResolvedValue({
      id: "quiz-empty",
      title: "Empty Quiz",
      quizType: "open_ended",
      questions: [],
    });

    const result = await submitAndGradeAdminQuizAttempt({
      quizId: "quiz-empty",
      userId: "u4",
      answers: ["anything"],
    });

    expect(result.score).toBe(0);
    expect(result.questionResults).toEqual([]);
    expect(saveUserQuizAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        quizId: "quiz-empty",
        score: 0,
      }),
    );
  });
});
