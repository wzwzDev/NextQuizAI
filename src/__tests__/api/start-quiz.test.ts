import { GET, POST } from "@/app/api/start-quiz/route";
import { NextRequest } from "next/server";
import * as authModule from "@/server/core/auth";
import * as adminQuizServiceModule from "@/server/admin/services/adminQuizService";
import * as userReadServiceModule from "@/server/services/userReadService";
import * as userQuizAttemptServiceModule from "@/server/services/userQuizAttemptService";
import * as adminQuizAttemptServiceModule from "@/server/admin/services/adminQuizAttemptService";

jest.mock("@/server/core/auth");
jest.mock("@/server/admin/services/adminQuizService");
jest.mock("@/server/services/userReadService");
jest.mock("@/server/services/userQuizAttemptService");
jest.mock("@/server/admin/services/adminQuizAttemptService");
jest.mock("@/server/core/quizQuestionMetadata", () => ({
  parseQuestionMetadata: jest.fn((options) => ({ options: [], citation: null })),
}));

describe("start-quiz route", () => {
  const mockRequest = (url: string = "http://localhost:3000/api/start-quiz") => ({
    url,
    json: jest.fn(),
  } as unknown as NextRequest);

  const mockSession = {
    user: { id: "user-123", email: "test@test.com" },
  };

  const mockQuiz = {
    id: "quiz-1",
    title: "Test Quiz",
    category: "Science",
    difficulty: "medium",
    quizType: "mcq",
    allowedAttempts: 3,
    questions: [
      {
        id: "q1",
        question: "What is 2+2?",
        options: '{"options": ["4", "5", "6"],"citation": null}',
      },
    ],
  };

  describe("GET - Basic auth checks", () => {
    it("should return 401 when not authenticated", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(null);
      const req = mockRequest();

      const response = await GET(req);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 when user ID missing", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue({
        user: { id: null },
      });
      const req = mockRequest();

      const response = await GET(req);

      expect(response.status).toBe(401);
    });

    it("should return 403 when user is revoked", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      (userReadServiceModule.getUserRevokedStatus as jest.Mock).mockResolvedValue(
        true
      );
      const req = mockRequest();

      const response = await GET(req);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("User is revoked");
    });

    it("should return 400 when quiz ID is missing", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      (userReadServiceModule.getUserRevokedStatus as jest.Mock).mockResolvedValue(
        false
      );
      const req = mockRequest("http://localhost:3000/api/start-quiz");

      const response = await GET(req);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Quiz ID is required");
    });

    it("should return 404 when quiz not found", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      (userReadServiceModule.getUserRevokedStatus as jest.Mock).mockResolvedValue(
        false
      );
      (adminQuizServiceModule.getApprovedQuiz as jest.Mock).mockResolvedValue(null);
      const req = mockRequest(
        "http://localhost:3000/api/start-quiz?id=nonexistent"
      );

      const response = await GET(req);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Quiz not found.");
    });

    it("should return 500 on unexpected error", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      (userReadServiceModule.getUserRevokedStatus as jest.Mock).mockResolvedValue(
        false
      );
      (adminQuizServiceModule.getApprovedQuiz as jest.Mock).mockResolvedValue(
        mockQuiz
      );
      (
        userQuizAttemptServiceModule.ensurePendingQuizAttempt as jest.Mock
      ).mockRejectedValue(new Error("Database error"));
      const req = mockRequest("http://localhost:3000/api/start-quiz?id=quiz-1");

      const response = await GET(req);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to load quiz.");
    });

    it("should return 200 with quiz data on success", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      (userReadServiceModule.getUserRevokedStatus as jest.Mock).mockResolvedValue(
        false
      );
      (adminQuizServiceModule.getApprovedQuiz as jest.Mock).mockResolvedValue(
        mockQuiz
      );
      (
        userQuizAttemptServiceModule.ensurePendingQuizAttempt as jest.Mock
      ).mockResolvedValue({
        status: "in_progress",
        startedAt: new Date(),
      });
      (
        userQuizAttemptServiceModule.getCompletedAttemptsForUser as jest.Mock
      ).mockResolvedValue([
        { quizId: "quiz-1", completedAttempts: 1 },
      ]);
      const req = mockRequest("http://localhost:3000/api/start-quiz?id=quiz-1");

      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.quiz.id).toBe("quiz-1");
      expect(data.quiz.title).toBe("Test Quiz");
      expect(data.attempts.current).toBe(2);
    });

    it("should handle empty completed attempts array", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      (userReadServiceModule.getUserRevokedStatus as jest.Mock).mockResolvedValue(
        false
      );
      (adminQuizServiceModule.getApprovedQuiz as jest.Mock).mockResolvedValue(
        mockQuiz
      );
      (
        userQuizAttemptServiceModule.ensurePendingQuizAttempt as jest.Mock
      ).mockResolvedValue({
        status: "in_progress",
        startedAt: new Date(),
      });
      (
        userQuizAttemptServiceModule.getCompletedAttemptsForUser as jest.Mock
      ).mockResolvedValue([]);
      const req = mockRequest("http://localhost:3000/api/start-quiz?id=quiz-1");

      const response = await GET(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.attempts.current).toBe(1);
      expect(data.attempts.completed).toBe(0);
    });
  });

  describe("POST - Basic auth and validation", () => {
    it("should return 401 when not authenticated", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(null);
      const req = mockRequest();
      req.json = jest.fn().mockResolvedValue({ quizId: "quiz-1", answers: [] });

      const response = await POST(req);

      expect(response.status).toBe(401);
    });

    it("should return 400 on invalid JSON", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      const req = mockRequest();
      req.json = jest
        .fn()
        .mockRejectedValue(new SyntaxError("Invalid JSON"));

      const response = await POST(req);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid JSON");
    });

    it("should return 400 on validation error", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      const req = mockRequest();
      req.json = jest.fn().mockResolvedValue({ invalid: "data" });

      const response = await POST(req);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid request payload");
    });

    it("should return 500 on unexpected error", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      (
        adminQuizAttemptServiceModule.submitAndGradeAdminQuizAttempt as jest.Mock
      ).mockRejectedValue(new Error("Database error"));
      const req = mockRequest();
      req.json = jest
        .fn()
        .mockResolvedValue({ quizId: "quiz-1", answers: [] });

      const response = await POST(req);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to submit quiz.");
    });

    it("should return 200 with results on success", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      (
        adminQuizAttemptServiceModule.submitAndGradeAdminQuizAttempt as jest.Mock
      ).mockResolvedValue({
        score: 85,
        grade: "A",
      });
      (adminQuizServiceModule.getApprovedQuiz as jest.Mock).mockResolvedValue(
        mockQuiz
      );
      (
        userQuizAttemptServiceModule.getCompletedAttemptsForUser as jest.Mock
      ).mockResolvedValue([
        { quizId: "quiz-1", completedAttempts: 1 },
      ]);
      const req = mockRequest();
      req.json = jest
        .fn()
        .mockResolvedValue({ quizId: "quiz-1", answers: [] });

      const response = await POST(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.score).toBe(85);
      expect(data.attempts.allowed).toBe(3);
    });

    it("should handle quiz not found when fetching for attempt update", async () => {
      (authModule.getAuthSession as jest.Mock).mockResolvedValue(mockSession);
      (
        adminQuizAttemptServiceModule.submitAndGradeAdminQuizAttempt as jest.Mock
      ).mockResolvedValue({
        score: 75,
      });
      (adminQuizServiceModule.getApprovedQuiz as jest.Mock).mockResolvedValue(null);
      (
        userQuizAttemptServiceModule.getCompletedAttemptsForUser as jest.Mock
      ).mockResolvedValue([]);
      const req = mockRequest();
      req.json = jest
        .fn()
        .mockResolvedValue({ quizId: "quiz-1", answers: [] });

      const response = await POST(req);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.attempts.allowed).toBe(2); // Default value
    });
  });
});
