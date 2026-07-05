import { POST } from "@/app/api/(admin)/quizzes/generate-from-file/route";
import { getAuthSession } from "@/server/core/auth";
import { generateQuestionsFromUploadedFile } from "@/server/services/uploadQuizGenerationService";
import { NextRequest } from "next/server";

jest.mock("@/server/core/auth");
jest.mock("@/server/services/uploadQuizGenerationService");

const mockGetAuthSession = getAuthSession as jest.MockedFunction<
  typeof getAuthSession
>;
const mockGenerateQuestionsFromUploadedFile =
  generateQuestionsFromUploadedFile as jest.MockedFunction<
    typeof generateQuestionsFromUploadedFile
  >;

describe("POST /api/(admin)/quizzes/generate-from-file", () => {
  const mockFile = new File(["test content"], "test.pdf", {
    type: "application/pdf",
  });
  const mockAdminSession = {
    user: {
      id: "admin-1",
      email: "admin@example.com",
      isAdmin: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should reject request with 401 when user is not authenticated", async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toContain("admin");
    });

    it("should reject request with 401 when user is not admin", async () => {
      mockGetAuthSession.mockResolvedValue({
        user: {
          id: "user-1",
          email: "user@example.com",
          isAdmin: false,
        },
      });

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("File validation", () => {
    it("should return 400 when no file is provided", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("quizType", "mcq");
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("file");
    });
  });

  describe("Quiz type validation", () => {
    it("should return 400 when quiz type is missing", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid quiz type");
    });

    it("should return 400 when quiz type is invalid", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "invalid_type");
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid quiz type");
    });

    it("should accept 'mcq' as valid quiz type", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);
      mockGenerateQuestionsFromUploadedFile.mockResolvedValue({
        questions: [],
        fileType: "pdf",
        format: "pdf",
      });

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should accept 'open_ended' as valid quiz type", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);
      mockGenerateQuestionsFromUploadedFile.mockResolvedValue({
        questions: [],
        fileType: "pdf",
        format: "pdf",
      });

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "open_ended");
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Question count validation", () => {
    it("should return 400 when question count is missing", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("between 1 and 50");
    });

    it("should return 400 when question count is 0", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "0");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("between 1 and 50");
    });

    it("should return 400 when question count exceeds 50", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "51");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("between 1 and 50");
    });

    it("should accept valid question count within range", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);
      mockGenerateQuestionsFromUploadedFile.mockResolvedValue({
        questions: [],
        fileType: "pdf",
        format: "pdf",
      });

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "25");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Generation success", () => {
    it("should return 200 with generated questions", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);
      const mockQuestions = [
        { id: 1, text: "Question 1", answer: "Answer 1" },
        { id: 2, text: "Question 2", answer: "Answer 2" },
      ];
      mockGenerateQuestionsFromUploadedFile.mockResolvedValue({
        questions: mockQuestions,
        fileType: "pdf",
        format: "pdf",
      });

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "2");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.questions).toEqual(mockQuestions);
      expect(body.fileType).toBe("pdf");
    });

    it("should pass correct parameters to generation service", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);
      mockGenerateQuestionsFromUploadedFile.mockResolvedValue({
        questions: [],
        fileType: "pdf",
        format: "pdf",
      });

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "10");
      formData.append("category", "Science");
      formData.append("difficulty", "hard");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      await POST(request);

      expect(mockGenerateQuestionsFromUploadedFile).toHaveBeenCalledWith(
        mockFile,
        expect.objectContaining({
          quizType: "mcq",
          questionCount: 10,
          category: "Science",
          difficulty: "hard",
        })
      );
    });
  });

  describe("Rate limiting", () => {
    it("should return 429 when rate limit is reached", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);
      mockGenerateQuestionsFromUploadedFile.mockRejectedValue(
        new Error("rate limit exceeded")
      );

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toContain("Rate limit");
    });
  });

  describe("Error handling", () => {
    it("should return 400 for generation errors", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);
      mockGenerateQuestionsFromUploadedFile.mockRejectedValue(
        new Error("Invalid file format")
      );

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Failed to generate questions from file");
    });

    it("should return 400 for unexpected generation errors", async () => {
      mockGetAuthSession.mockResolvedValue(mockAdminSession);
      mockGenerateQuestionsFromUploadedFile.mockRejectedValue(
        new Error("Unexpected error")
      );

      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("quizType", "mcq");
      formData.append("questionCount", "5");

      const request = new NextRequest("http://localhost/api/(admin)/quizzes/generate-from-file", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Failed to generate questions from file");
    });
  });
});
